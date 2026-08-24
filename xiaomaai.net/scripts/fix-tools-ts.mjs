/**
 * fix-tools-ts.mjs
 * 修复 tools.ts：在 entry 之间的 `}` 后补 `,`
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TOOLS_FILE = path.join(__dirname, '..', 'data', 'tools.ts')

const content = await fs.readFile(TOOLS_FILE, 'utf-8')

// 在 entry 间的 `}` 后补 `,`
// 匹配：紧跟着 `\n  {`（下一 entry 开始）的 `}`
let fixed = content
let pass = 0
while (pass < 5) {
  const before = fixed
  // 找 `}` 后跟 `\n  {` 的位置，补 `,`
  fixed = fixed.replace(/(\n  \})\n(  \{)/g, '$1,\n$2')
  // 找重复的 `},\n  },\n` 合并为 `},\n  }`
  fixed = fixed.replace(/(\n  \},\n)(\s*\n  \},)/g, '$2'.replace(',', ''))
  if (fixed === before) break
  pass++
}

// 删除孤立的 `\n  },\n  },\n`（连续两个结尾）
fixed = fixed.replace(/\n  \},\n  \},/g, '\n  },')

// 最后一项（数组末尾）不应有 `,`
// 找 `]\n` 之前最后一个 `},` 改为 `}`
fixed = fixed.replace(/(\n  \}),(\n\]\n)/g, '$1$2')

await fs.writeFile(TOOLS_FILE, fixed, 'utf-8')

// 验证：尝试解析
const count = (fixed.match(/^\s+id:\s*'/gm) || []).length
console.log(`✅ 修复完成，共 ${count} 个工具，文件大小 ${(fixed.length / 1024).toFixed(1)} KB`)
