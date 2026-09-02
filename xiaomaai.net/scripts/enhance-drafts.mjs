#!/usr/bin/env node
/**
 * enhance-drafts.mjs
 * 自动翻译/生成英文草稿简介
 * 用法:
 *   node scripts/enhance-drafts.mjs --dry-run    # 只预览，不写入
 *   node scripts/enhance-drafts.mjs --apply      # 写入 tools-draft.ts
 * 依赖: data/llm-config.json (在 /admin/settings 配置)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)
const DRY_RUN = args['dry-run'] === 'true'
const APPLY = args.apply === 'true'

// 从 TS 文件中提取数组
function extractArray(raw, marker) {
  const start = raw.indexOf(marker)
  if (start === -1) return []
  const arrStart = start + marker.length
  let depth = 1
  let inStr = false
  for (let i = arrStart; i < raw.length; i++) {
    const c = raw[i]
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; continue }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return JSON.parse(raw.slice(arrStart - 1, i + 1))
    }
  }
  return []
}

function isMostlyEnglish(s) {
  return !/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(s || '')
}

// 读取 LLM 配置
const configPath = path.join(ROOT, 'data', 'llm-config.json')
if (!existsSync(configPath)) {
  console.error('❌ 未找到 data/llm-config.json')
  console.error('   请在 /admin/settings 配置大模型 API')
  process.exit(1)
}
const config = JSON.parse(readFileSync(configPath, 'utf-8'))
if (!config.apiUrl || !config.apiKey) {
  console.error('❌ LLM 配置不完整，需要 apiUrl 和 apiKey')
  console.error('   请在 /admin/settings 配置')
  process.exit(1)
}
console.log(`🤖 使用模型: ${config.model} (${config.apiUrl})`)

// 读取草稿
const draftPath = path.join(ROOT, 'data', 'tools-draft.ts')
const raw = readFileSync(draftPath, 'utf-8')
const drafts = extractArray(raw, 'export const toolDrafts: ToolDraft[] = [')

// 筛选需翻译/需重写的条目
const toTranslate = drafts.filter((d) => {
  const desc = d.tool?.description || ''
  return desc.length >= 30 && isMostlyEnglish(desc)
})
const toRewrite = drafts.filter((d) => {
  const desc = d.tool?.description || ''
  return desc.length < 30 && isMostlyEnglish(desc)
})

console.log(`📊 草稿共 ${drafts.length} 条`)
console.log(`🌐 需翻译: ${toTranslate.length} 条`)
console.log(`✏️  需重写: ${toRewrite.length} 条`)

if (toTranslate.length === 0 && toRewrite.length === 0) {
  console.log('\n✅ 无需处理')
  process.exit(0)
}

// 调用大模型 API
async function callLLM(systemPrompt, userPrompt) {
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

const TRANSLATE_PROMPT = '你是AI工具简介翻译专家。将用户提供的英文AI工具简介翻译为简洁的中文，保留专有名词（如GPT、Claude、API等），控制在30-80字。只返回翻译结果，不要解释。'
const REWRITE_PROMPT = '你是AI工具简介撰写专家。根据用户提供的工具名称和英文简介，写一段30-50字的中文简介，说明这个工具是什么、能做什么。只返回简介内容，不要解释。'

async function processAll() {
  const results = []
  const all = [
    ...toTranslate.map((d) => ({ draft: d, action: 'translate' })),
    ...toRewrite.map((d) => ({ draft: d, action: 'rewrite' })),
  ]

  for (let i = 0; i < all.length; i++) {
    const { draft, action } = all[i]
    const name = draft.tool?.name || 'unknown'
    const desc = draft.tool?.description || ''
    console.log(`\n[${i + 1}/${all.length}] ${action === 'translate' ? '翻译' : '重写'}: ${name}`)

    try {
      let result
      if (action === 'translate') {
        result = await callLLM(TRANSLATE_PROMPT, desc)
      } else {
        result = await callLLM(REWRITE_PROMPT, `工具名: ${name}\n英文简介: ${desc}`)
      }
      console.log(`  → ${result}`)
      results.push({ draft, action, original: desc, translated: result })
    } catch (e) {
      console.error(`  ❌ 失败: ${e.message}`)
      results.push({ draft, action, original: desc, translated: desc, error: e.message })
    }
    // 礼貌限速
    if (i < all.length - 1) await new Promise((r) => setTimeout(r, 500))
  }

  return results
}

const results = await processAll()

if (DRY_RUN) {
  console.log('\n\n📝 预览结果 (--dry-run，未写入):')
  for (const r of results) {
    console.log(`\n${r.draft.tool?.name} (${r.action})`)
    console.log(`  原: ${r.original}`)
    console.log(`  新: ${r.translated}`)
  }
  process.exit(0)
}

if (APPLY) {
  // 更新草稿
  const updated = drafts.map((d) => {
    const r = results.find((x) => x.draft === d)
    if (r && !r.error) {
      return { ...d, tool: { ...d.tool, description: r.translated } }
    }
    return d
  })

  const header = `// 草稿区: import 脚本自动写入,人工在 /admin/tools 审核后入库
// 自动翻译时间: ${new Date().toISOString()}
// 翻译模型: ${config.model}

export interface ToolDraft {
  source: string
  sourceUrl?: string
  fetchedAt: string
  tool: {
    slug: string
    name: string
    description: string
    url: string
    logoUrl?: string
    category: string
    tags?: string[]
    pricing?: string
    rating?: number
    featured?: boolean
    [key: string]: unknown
  }
}

export const toolDrafts: ToolDraft[] = ${JSON.stringify(updated, null, 2)}

export function getToolDrafts(): ToolDraft[] {
  return toolDrafts
}
`
  writeFileSync(draftPath, header, 'utf-8')
  const success = results.filter((r) => !r.error).length
  console.log(`\n✅ 已翻译/重写 ${success}/${results.length} 条，写入 tools-draft.ts`)
} else {
  console.log('\n⚠️  未指定 --apply，未写入文件')
  console.log('   使用 --apply 写入，--dry-run 仅预览')
}
