#!/usr/bin/env node
/**
 * clean-draft.mjs
 * 清理 tools-draft.ts 中无价值的草稿条目
 * 用法: node scripts/clean-draft.mjs [--source=producthunt] [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)
const DRAFT_FILE = path.join(__dirname, '..', 'data', 'tools-draft.ts')
const TARGET_SOURCE = args.source || 'producthunt'
const DRY_RUN = args['dry-run'] === 'true'

// 从 TS 文件中提取数组(括号匹配,忽略字符串内括号)
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
      if (depth === 0) {
        return JSON.parse(raw.slice(arrStart - 1, i + 1))
      }
    }
  }
  return []
}

if (!existsSync(DRAFT_FILE)) {
  console.error('❌ tools-draft.ts 不存在')
  process.exit(1)
}

const raw = readFileSync(DRAFT_FILE, 'utf-8')
const drafts = extractArray(raw, 'export const toolDrafts: ToolDraft[] = [')
console.log(`📊 草稿区共 ${drafts.length} 条`)

const before = drafts.length
const kept = drafts.filter((d) => d.source !== TARGET_SOURCE)
const removed = drafts.filter((d) => d.source === TARGET_SOURCE)
console.log(`🗑️  清理 source="${TARGET_SOURCE}" 的条目: ${removed.length} 条`)
console.log(`✅ 保留 ${kept.length} 条`)

if (removed.length > 0) {
  console.log('\n清理的条目:')
  removed.forEach((d, i) => {
    const name = d.tool?.name || d.tool?.slug || 'unknown'
    console.log(`  ${i + 1}. ${name} (source: ${d.source})`)
  })
}

if (DRY_RUN) {
  console.log('\n🔍 --dry-run 模式,未写入文件')
  process.exit(0)
}

if (removed.length === 0) {
  console.log('\n无需清理')
  process.exit(0)
}

// 生成新文件内容
const header = `// 草稿区: import 脚本自动写入,人工在 /admin/tools 审核后入库
// 清理时间: ${new Date().toISOString()}
// 清理规则: 移除 source="${TARGET_SOURCE}" 的 ${removed.length} 条无价值草稿

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

export const toolDrafts: ToolDraft[] = ${JSON.stringify(kept, null, 2)}

export function getToolDrafts(): ToolDraft[] {
  return toolDrafts
}
`

writeFileSync(DRAFT_FILE, header, 'utf-8')
console.log(`\n✅ 已写入 ${DRAFT_FILE}`)
