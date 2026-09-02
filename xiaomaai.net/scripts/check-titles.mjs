import { readFileSync } from 'fs'
const raw = readFileSync('data/news-draft.ts', 'utf-8')
const titles = [...raw.matchAll(/"title": "([^"]+)"/g)].slice(0, 10)
console.log('前10条标题:')
titles.forEach((t, i) => console.log(`  ${i + 1}. ${t[1]}`))

// 检查是否有英文标题
const allTitles = [...raw.matchAll(/"title": "([^"]+)"/g)].map(m => m[1])
const cnCount = allTitles.filter(t => /[\u4e00-\u9fff]/.test(t)).length
const enCount = allTitles.filter(t => !/[\u4e00-\u9fff]/.test(t)).length
console.log(`\n中文标题: ${cnCount} 条`)
console.log(`纯英文标题: ${enCount} 条`)