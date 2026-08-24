#!/usr/bin/env node
/**
 * 每日抓取 AI 资讯 → 写入 data/news-draft.ts 草稿区
 * 由 .github/workflows/daily-news-draft.yml 触发
 * 只抓取不 commit,人工在 /admin/news 后台 review 后再发布
 */
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import Parser from 'rss-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 10 个高质 RSS 源
const SOURCES = [
  { name: '36kr AI', url: 'https://36kr.com/feed', lang: 'zh' },
  { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', lang: 'zh' },
  { name: '量子位', url: 'https://www.qbitai.com/feed', lang: 'zh' },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI&points=100', lang: 'en' },
  { name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed?category=artificial-intelligence', lang: 'en' },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', lang: 'en' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/rss.xml', lang: 'en' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', lang: 'en' },
  { name: '新智元', url: 'https://www.xinship.cn/feed', lang: 'zh' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en' },
]

// 标题关键词 → 分类
const CATEGORY_RULES = [
  { cat: 'llm', keywords: ['gpt', 'claude', 'gemini', 'llama', 'deepseek', '模型', '大模型', 'openai', 'anthropic', 'google'] },
  { cat: 'opensource', keywords: ['开源', 'open source', 'mit', 'apache', 'huggingface', 'github'] },
  { cat: 'funding', keywords: ['融资', '收购', '估值', '投资', 'funding', 'acquisition'] },
  { cat: 'business', keywords: ['发布', '上线', '合作', '报告', '新闻', 'launch'] },
]

function guessCategory(text) {
  const t = (text || '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.cat
  }
  return 'business'
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

// 从 TS 文件中提取 export const xxx: Type[] = [...] 数组(括号匹配,忽略字符串内括号)
// 注意: 数组内容由 JSON.stringify 生成,字符串统一用双引号,故只识别双引号边界
function extractArray(raw, marker) {
  const start = raw.indexOf(marker)
  if (start === -1) return []
  const arrStart = start + marker.length
  let depth = 1 // marker 以 '[' 结尾
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

async function main() {
  const parser = new Parser({ timeout: 15000 })
  const seen = new Set()
  const items = []

  // 读取已有草稿做去重
  const draftPath = path.join(__dirname, '..', 'data', 'news-draft.ts')
  const newsPath = path.join(__dirname, '..', 'data', 'news.ts')

  const existingTitles = new Set()
  const titlePattern = /title[: ]*['"]([^'"]+)['"]/g
  for (const file of [draftPath, newsPath]) {
    if (!existsSync(file)) continue
    const raw = readFileSync(file, 'utf-8')
    const matches = raw.matchAll(titlePattern)
    for (const m of matches) existingTitles.add(m[1])
  }

  for (const source of SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      const list = (feed.items || []).slice(0, 15)
      for (const item of list) {
        const title = (item.title || '').trim().slice(0, 80)
        if (!title) continue
        const h = hash(title)
        if (seen.has(h)) continue
        seen.add(h)
        if (existingTitles.has(title)) continue

        const summary = (item.contentSnippet || item.content || '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120)

        items.push({
          id: h,
          title,
          source: source.name,
          lang: source.lang,
          url: item.link || source.url,
          summary: summary || title,
          category: guessCategory(title + ' ' + summary),
          publishedAt: item.pubDate || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          status: 'draft',
        })
      }
      console.log(`[OK] ${source.name}: +${list.length} items`)
    } catch (e) {
      console.warn(`[FAIL] ${source.name}: ${e.message}`)
    }
  }

  // 保留已有草稿(从上次生成的文件中解析),新条目追加到最前
  let existingDrafts = extractArray(
    existsSync(draftPath) ? readFileSync(draftPath, 'utf-8') : '',
    'export const newsDrafts: NewsDraft[] = ['
  )

  const merged = [...items, ...existingDrafts].slice(0, 50)

  const output = `// 草稿区: GitHub Actions 自动抓取写入,人工在 /admin/news 审核发布
// 抓取时间: ${new Date().toISOString()}

export interface NewsDraft {
  id: string
  title: string
  source: string
  lang?: 'zh' | 'en'
  url: string
  summary: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

export const newsDrafts: NewsDraft[] = ${JSON.stringify(merged, null, 2)}

export function getNewsDrafts(): NewsDraft[] {
  return newsDrafts
}
`

  writeFileSync(draftPath, output, 'utf-8')
  console.log(`\n✅ 本次新增 ${items.length} 条,草稿区共 ${merged.length} 条 → ${draftPath}`)
  console.log('⚠️ 仅写入草稿,未自动 commit。请在 /admin/news 或本地 review 后手动发布。')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
