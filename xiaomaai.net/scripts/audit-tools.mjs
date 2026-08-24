// =====================================================
// 工具信息补全辅助脚本 (不调用 LLM)
// 用法: node scripts/audit-tools.mjs [--limit=20] [--out=scripts/audit-tools.report.md]
// 输出: scripts/audit-tools.report.md
//   - 第一段: 缺 logo 的工具(列出 og:image 候选)
//   - 第二段: 缺中文描述 / 介绍过短(< 30 字符)的工具(列出 og:description 候选 + 翻译建议)
//   - 第三段: 完整「待补全字段表」(CSV 风格, 方便复制)
// =====================================================
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)
const LIMIT = parseInt(args.limit || '99999', 10)
const OUT = path.join(ROOT, args.out || 'scripts/audit-tools.report.md')
const TOOLS_FILE = path.join(ROOT, 'data', 'tools.ts')
const CONCURRENCY = 3

// 复用现有 extractArray 思路 (marker 定位 + 括号匹配)
// 同时支持单/双引号字符串边界
function extractArray(raw, marker) {
  const start = raw.indexOf(marker)
  if (start === -1) return []
  const arrStart = start + marker.length
  let depth = 1
  let quote = '' // 当前字符串边界: ' " 或空
  for (let i = arrStart; i < raw.length; i++) {
    const c = raw[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = ''
      continue
    }
    if (c === '"' || c === "'") { quote = c; continue }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) {
        // 切片是单引号风格, 不能直接 JSON.parse, 用 eval 风险太高
        // 改为手工解析: 先把单引号字符串转双引号 (注意: 内容里的 ' 需要转义)
        let sliced = raw.slice(arrStart - 1, i + 1)
        // 简化: 直接用 Function 构造器解析对象字面量数组
        // 安全: 只允许数组字面量
        // 实际更安全: 用一个简单的状态机重新序列化
        return parseTsArray(sliced)
      }
    }
  }
  return []
}

// 把 TS 风格的数组字面量 [{...}, {...}] 解析为 JS 对象
// 支持单/双引号字符串, 数字, 布尔, null, 嵌套数组/对象
function parseTsArray(src) {
  // 1. 提取 [ ... ] 内部
  const inner = src.trim().replace(/^\[/, '').replace(/\]$/, '')
  return parseArrayBody(inner, 0).value
}

function parseArrayBody(src, start) {
  const items = []
  let i = start
  while (i < src.length) {
    // 跳过空白和逗号
    while (i < src.length && /[\s,]/.test(src[i])) i++
    if (i >= src.length) break
    if (src[i] === ']') return { value: items, end: i }
    // 解析一个值
    const r = parseValue(src, i)
    items.push(r.value)
    i = r.end
  }
  return { value: items, end: i }
}

function parseValue(src, i) {
  // 跳过空白
  while (i < src.length && /\s/.test(src[i])) i++
  const c = src[i]
  if (c === '"' || c === "'") return parseString(src, i)
  if (c === '[') return parseArr(src, i)
  if (c === '{') return parseObj(src, i)
  if (c === 't' && src.slice(i, i + 4) === 'true') return { value: true, end: i + 4 }
  if (c === 'f' && src.slice(i, i + 5) === 'false') return { value: false, end: i + 5 }
  if (c === 'n' && src.slice(i, i + 4) === 'null') return { value: null, end: i + 4 }
  if (c === 'u' && src.slice(i, i + 9) === 'undefined') return { value: undefined, end: i + 9 }
  if (c === '-' || (c >= '0' && c <= '9')) return parseNum(src, i)
  throw new Error(`Unexpected char "${c}" at ${i}: ${src.slice(Math.max(0, i - 10), i + 20)}`)
}

function parseString(src, i) {
  const quote = src[i]
  let out = ''
  let j = i + 1
  while (j < src.length) {
    const c = src[j]
    if (c === '\\') {
      const n = src[j + 1]
      if (n === 'n') out += '\n'
      else if (n === 't') out += '\t'
      else if (n === 'r') out += '\r'
      else if (n === 'b') out += '\b'
      else if (n === 'f') out += '\f'
      else if (n === 'v') out += '\v'
      else if (n === '0') out += '\0'
      else out += n || ''
      j += 2
      continue
    }
    if (c === quote) return { value: out, end: j + 1 }
    out += c
    j++
  }
  throw new Error('Unterminated string')
}

function parseNum(src, i) {
  let j = i
  if (src[j] === '-') j++
  while (j < src.length && /[0-9.]/.test(src[j])) j++
  return { value: parseFloat(src.slice(i, j)), end: j }
}

function parseArr(src, i) {
  const r = parseArrayBody(src, i + 1)
  return { value: r.value, end: r.end + 1 }
}

function parseObj(src, i) {
  const obj = {}
  let j = i + 1
  while (j < src.length) {
    while (j < src.length && /[\s,]/.test(src[j])) j++
    if (src[j] === '}') return { value: obj, end: j + 1 }
    // key 可以是 "string" / 'string' / bareIdent
    let k
    if (src[j] === '"' || src[j] === "'") {
      k = parseString(src, j)
    } else {
      // 裸标识符
      const start = j
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++
      k = { value: src.slice(start, j), end: j }
    }
    j = k.end
    while (j < src.length && /\s/.test(src[j])) j++
    if (src[j] !== ':') throw new Error(`Expected ":" at ${j}`)
    j++
    const v = parseValue(src, j)
    j = v.end
    obj[k.value] = v.value
  }
  throw new Error('Unterminated object')
}

const raw = readFileSync(TOOLS_FILE, 'utf-8')
const tools = extractArray(raw, 'export const tools: Tool[] = [')
console.log(`[audit] 共 ${tools.length} 个工具, 限制扫描 ${LIMIT} 个`)

// 判断描述质量
function isChineseDescription(s) {
  if (!s) return false
  // 至少 5 个中文字符
  const cnCount = (s.match(/[\u4e00-\u9fa5]/g) || []).length
  return cnCount >= 5
}
function isShortDescription(s) {
  if (!s) return true
  return s.length < 30
}

const needsLogo = tools.filter((t) => !t.logoUrl || t.logoUrl === '').slice(0, LIMIT)
const needsDesc = tools.filter((t) => !isChineseDescription(t.description) || isShortDescription(t.description)).slice(0, LIMIT)

console.log(`[audit] 缺 logo: ${needsLogo.length} 条`)
console.log(`[audit] 缺/短中文描述: ${needsDesc.length} 条`)

// 抓取 og meta
async function fetchOgMeta(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xiaomaai-audit/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)
    const get = (selector) =>
      $(selector).attr('content') ||
      $(selector).attr('href') ||
      $(`meta[property="${selector}"]`).attr('content') ||
      $(`meta[name="${selector}"]`).attr('content') ||
      ''
    return {
      title: get('og:title') || $('title').text().trim(),
      description: get('og:description') || get('description') || $('meta[name="description"]').attr('content') || '',
      image: get('og:image') || get('twitter:image') || '',
    }
  } catch {
    return null
  }
}

// 限速并发
async function pLimit(items, fn, limit) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      const item = items[i]
      results[i] = await fn(item, i)
    }
  })
  await Promise.all(workers)
  return results
}

console.log('[audit] 抓取 og:meta(限速 3 并发)...')
const logoResults = await pLimit(needsLogo, async (t) => {
  const meta = await fetchOgMeta(t.url)
  return { tool: t, meta }
}, CONCURRENCY)

const descResults = await pLimit(needsDesc, async (t) => {
  const meta = await fetchOgMeta(t.url)
  return { tool: t, meta }
}, CONCURRENCY)

const stats = {
  logoOk: logoResults.filter((r) => r.meta?.image).length,
  logoFail: logoResults.filter((r) => !r.meta?.image).length,
  descOk: descResults.filter((r) => r.meta?.description).length,
  descFail: descResults.filter((r) => !r.meta?.description).length,
}
console.log('[audit] 抓取结果:', stats)

// 生成 Markdown 报告
function escapeMd(s) {
  if (!s) return ''
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200)
}

let md = `# 工具信息补全审计报告

> 生成时间: ${new Date().toISOString()}
> 数据源: \`data/tools.ts\` (${tools.length} 个工具)
> 扫描工具: ${LIMIT}
> 缺 logo: **${needsLogo.length}** 条 / 缺/短中文描述: **${needsDesc.length}** 条
> og 抓取成功率: logo ${stats.logoOk}/${logoResults.length}, desc ${stats.descOk}/${descResults.length}

## 1. 缺 logo 的工具(${needsLogo.length} 条)

> 候选 \`og:image\` URL 可直接复制到 \`data/tools.ts\` 的 \`logoUrl\` 字段
> ⚠️ 本脚本不调用 LLM, 描述翻译需人工完成

| # | slug | name | 当前 logoUrl | 候选 og:image | 抓取结果 |
|---|------|------|--------------|----------------|----------|
`

logoResults.forEach((r, i) => {
  const t = r.tool
  const og = r.meta?.image || '_(抓取失败)_'
  const status = r.meta?.image ? '✅' : '❌'
  md += `| ${i + 1} | \`${t.slug}\` | ${escapeMd(t.name)} | \`${t.logoUrl || '(空)'}\` | \`${escapeMd(og)}\` | ${status} |\n`
})

md += `\n## 2. 缺中文描述 / 介绍过短的工具(${needsDesc.length} 条)

> 当前描述若为英文, 需要人工翻译
> 候选 \`og:description\` 仅供参考, 建议人工润色为中文

| # | slug | 当前描述(前 60 字) | 描述字符数 | 候选 og:description(前 100 字) | 抓取结果 |
|---|------|----------------------|------------|--------------------------------|----------|
`

descResults.forEach((r, i) => {
  const t = r.tool
  const cur = (t.description || '').slice(0, 60)
  const len = (t.description || '').length
  const og = (r.meta?.description || '').slice(0, 100) || '_(抓取失败)_'
  const status = r.meta?.description ? '✅' : '❌'
  md += `| ${i + 1} | \`${t.slug}\` | ${escapeMd(cur)} | ${len} | ${escapeMd(og)} | ${status} |\n`
})

md += `\n## 3. 完整「待补全字段表」(CSV 风格)

> 可直接复制为 CSV 格式, 在 Excel/Numbers 中打开
> 列: \`slug | 当前 logoUrl | 候选 og:image | 当前 description | 候选 og:description\`

\`\`\`csv
slug,current_logoUrl,candidate_og_image,current_description,candidate_og_description
\``

// 用 Map 去重, 同一 slug 只输出一次 (取 logo/desc 任一缺失)
const slugSet = new Set()
for (const r of logoResults) slugSet.add(r.tool.slug)
for (const r of descResults) slugSet.add(r.tool.slug)

for (const r of logoResults) {
  if (!slugSet.has(r.tool.slug)) continue
  slugSet.delete(r.tool.slug)
  const t = r.tool
  const logoOg = logoResults.find((x) => x.tool.slug === t.slug)?.meta?.image || ''
  const descOg = descResults.find((x) => x.tool.slug === t.slug)?.meta?.description || ''
  md += `${t.slug},"${escapeMd(t.logoUrl || '')}","${escapeMd(logoOg)}","${escapeMd(t.description || '')}","${escapeMd(descOg)}"\n`
}
for (const r of descResults) {
  if (!slugSet.has(r.tool.slug)) continue
  slugSet.delete(r.tool.slug)
  const t = r.tool
  const logoOg = logoResults.find((x) => x.tool.slug === t.slug)?.meta?.image || ''
  const descOg = r.meta?.description || ''
  md += `${t.slug},"${escapeMd(t.logoUrl || '')}","${escapeMd(logoOg)}","${escapeMd(t.description || '')}","${escapeMd(descOg)}"\n`
}

md += `\`\`\`

## 4. 使用说明

1. 打开本报告: \`scripts/audit-tools.report.md\`
2. 在 IDE 中打开 \`data/tools.ts\`
3. 按第 1 段「缺 logo」清单, 把候选 og:image 复制到 \`logoUrl\` 字段
4. 按第 2 段「缺中文描述」清单, 人工翻译并润色 \`description\` 字段
5. 第 3 段是 CSV 表格, 适合在 Excel 中批量浏览
6. 一次提交即可完成所有补全

## 5. 边界

- **不调用任何 LLM** (节省成本)
- og 抓取有限速 3 并发, 不会触发目标站风控
- 部分网站可能 403 / 渲染需 JS, 这些情况 og 候选为空, 需要手动访问
`

writeFileSync(OUT, md, 'utf-8')
console.log(`[audit] 报告已写入: ${OUT}`)
console.log(`[audit] 完成: logo 候选 ${stats.logoOk}/${logoResults.length}, desc 候选 ${stats.descOk}/${descResults.length}`)
