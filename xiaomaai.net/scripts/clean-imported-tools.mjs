/**
 * clean-imported-tools.mjs
 * 清理上次导入的 393 个新工具（rating:0 且 featured:false）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TOOLS_FILE = path.join(__dirname, '..', 'data', 'tools.ts')

const content = await fs.readFile(TOOLS_FILE, 'utf-8')

// 匹配每个工具条目（基于 id 行定位到下一个 "  }," 或 "  }"）
const entryRegex = /  \{\n    id: '[^']+',\n    slug: '[^']+',[\s\S]*?(?=\n  \},?\n|$)/g

const allEntries = content.match(entryRegex) || []
console.log(`📊 当前文件有 ${allEntries.length} 个工具条目`)

// 过滤掉：rating: 0 且 featured: false
const kept = []
const removed = []
for (const entry of allEntries) {
  const isImported = /rating:\s*0,/.test(entry) && /featured:\s*false/.test(entry)
  if (isImported) {
    removed.push(entry)
  } else {
    kept.push(entry)
  }
}

console.log(`✅ 保留 ${kept.length} 个原始工具`)
console.log(`🗑️  删除 ${removed.length} 个上次导入的条目`)

// 重组文件
const newContent = content.replace(
  /(export const tools: Tool\[\] = \[\n)([\s\S]*?)(\n\]\n)/,
  (m, prefix, body, suffix) => {
    return prefix + kept.join('\n') + suffix
  }
)

await fs.writeFile(TOOLS_FILE, newContent, 'utf-8')
console.log(`✅ 已清理，文件大小 ${(newContent.length / 1024).toFixed(1)} KB`)
