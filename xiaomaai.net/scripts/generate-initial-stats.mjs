/**
 * generate-initial-stats.mjs
 *
 * 为 data/tools.ts 中 views=0 或 rating=0 的工具生成合理的初始值。
 * 算法基于工具 slug 的确定性哈希，保证幂等：已有非零值的工具不会被覆盖。
 *
 * 规则：
 *   baseHash = slug 所有字符 charCode 之和
 *   categoryMultiplier: chat=1.5, image=1.3, video=1.2, code=1.1, audio=0.9, productivity=1.0, 其他=0.8
 *   featuredBonus: featured=true 时 ×3
 *   views = Math.floor((100 + baseHash % 5000) * categoryMultiplier * (featured ? 3 : 1))
 *     范围控制在 50 ~ 15000 之间
 *   rating = parseFloat((3.5 + (baseHash % 15) / 10).toFixed(1))
 *     范围 3.5 ~ 5.0
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TOOLS_FILE = path.join(__dirname, '..', 'data', 'tools.ts')

const CATEGORY_MULTIPLIER = {
  chat: 1.5,
  image: 1.3,
  video: 1.2,
  code: 1.1,
  audio: 0.9,
  productivity: 1.0,
}

function baseHash(slug) {
  let sum = 0
  for (let i = 0; i < slug.length; i++) {
    sum += slug.charCodeAt(i)
  }
  return sum
}

function computeViews(slug, category, featured) {
  const hash = baseHash(slug)
  const mult = CATEGORY_MULTIPLIER[category] ?? 0.8
  const featuredMult = featured ? 3 : 1
  let views = Math.floor((100 + (hash % 5000)) * mult * featuredMult)
  if (views < 50) views = 50
  if (views > 15000) views = 15000
  return views
}

function computeRating(slug) {
  const hash = baseHash(slug)
  return parseFloat((3.5 + ((hash % 15) / 10)).toFixed(1))
}

const content = await fs.readFile(TOOLS_FILE, 'utf-8')

// 匹配每个工具对象块：从 `  {\n` 到 `  },` 或 `  }\n]`
// 使用非贪婪匹配，确保每个块只包含一个工具
const toolBlockRegex = /(  \{[\s\S]*?\n  \})(?:,|(?=\n\]))/g

let viewsUpdated = 0
let ratingUpdated = 0
let totalTools = 0

const newContent = content.replace(toolBlockRegex, (match, block) => {
  totalTools++

  // 提取 slug
  const slugMatch = block.match(/\n    slug:\s*'([^']+)'/)
  // 提取 category
  const categoryMatch = block.match(/\n    category:\s*'([^']+)'/)
  // 提取 featured
  const featuredMatch = block.match(/\n    featured:\s*(true|false)/)
  // 提取 views（当前值）
  const viewsMatch = block.match(/\n    views:\s*(\d+)/)
  // 提取 rating（当前值）
  const ratingMatch = block.match(/\n    rating:\s*([\d.]+)/)

  if (!slugMatch || !categoryMatch) {
    return match
  }

  const slug = slugMatch[1]
  const category = categoryMatch[1]
  const featured = featuredMatch ? featuredMatch[1] === 'true' : false

  let updatedBlock = block

  // 处理 views
  if (viewsMatch) {
    const currentViews = parseInt(viewsMatch[1], 10)
    if (currentViews === 0) {
      const newViews = computeViews(slug, category, featured)
      updatedBlock = updatedBlock.replace(
        /(\n    views:\s*)\d+/,
        `$1${newViews}`
      )
      viewsUpdated++
    }
  }

  // 处理 rating
  if (ratingMatch) {
    const currentRating = parseFloat(ratingMatch[1])
    if (currentRating === 0) {
      const newRating = computeRating(slug)
      updatedBlock = updatedBlock.replace(
        /(\n    rating:\s*)[\d.]+/,
        `$1${newRating}`
      )
      ratingUpdated++
    }
  }

  // 替换回原匹配（保留末尾的逗号或结尾）
  return match.replace(block, updatedBlock)
})

if (newContent === content) {
  console.log('ℹ️  没有需要修改的工具，文件未变化。')
} else {
  await fs.writeFile(TOOLS_FILE, newContent, 'utf-8')
}

console.log(`📊 统计结果：`)
console.log(`   总工具数：${totalTools}`)
console.log(`   更新 views：${viewsUpdated} 个`)
console.log(`   更新 rating：${ratingUpdated} 个`)
console.log(`✅ 完成。`)
