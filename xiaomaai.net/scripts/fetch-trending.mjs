#!/usr/bin/env node
/**
 * 每周抓取热门 AI 工具 → 写入 data/tools-draft.ts 草稿区
 * 数据源: GitHub 搜索(ai/llm/agent topic, stars>100) + Product Hunt AI RSS
 * 由 .github/workflows/weekly-trending-draft.yml 触发
 * 只抓取不 commit; 不调用 LLM(直接用原文 description)
 */
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import Parser from 'rss-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// GitHub 搜索 topic
const GITHUB_QUERIES = [
  { topic: 'ai', query: 'topic:ai stars:>100' },
  { topic: 'llm', query: 'topic:llm stars:>100' },
  { topic: 'agent', query: 'topic:agent stars:>100' },
]

const PRODUCT_HUNT_FEED = 'https://www.producthunt.com/feed?category=artificial-intelligence'

const TOKEN = process.env.GITHUB_TOKEN || ''

// 关键词 → 分类 (对应 data/tools.ts 中的 category 值)
const CATEGORY_RULES = [
  { cat: 'image', keywords: ['image', 'photo', 'art', 'design', 'generate image', 'stable diffusion', 'midjourney', '图片', '绘画'] },
  { cat: 'video', keywords: ['video', 'animation', 'film', 'sora', '视频', '动画'] },
  { cat: 'audio', keywords: ['audio', 'music', 'voice', 'speech', 'tts', '音乐', '语音'] },
  { cat: 'code', keywords: ['code', 'coding', 'program', 'developer', 'terminal', '代码', '编程', '开发'] },
  { cat: 'productivity', keywords: ['productivity', 'office', 'docs', 'workflow', '效率', '办公', '自动化'] },
]

function guessCategory(text) {
  const t = (text || '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.cat
  }
  return 'chat'
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

async function fetchGitHub(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'xiaoma-ai' }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const json = await res.json()
  return (json.items || []).map((repo) => ({
    source: 'github-trending',
    sourceUrl: repo.html_url,
    tool: {
      slug: repo.name,
      name: repo.name,
      description: (repo.description || '').slice(0, 200),
      url: repo.html_url,
      logoUrl: `https://github.com/${repo.owner.login}.png?size=128`,
      category: guessCategory((repo.name || '') + ' ' + (repo.description || '')),
      tags: (repo.topics || []).slice(0, 5),
      pricing: 'freemium',
      rating: 0,
      views: 0,
      createdAt: repo.created_at || new Date().toISOString(),
      updatedAt: repo.updated_at || new Date().toISOString(),
    },
  }))
}

async function fetchProductHunt() {
  const parser = new Parser({ timeout: 15000 })
  const feed = await parser.parseURL(PRODUCT_HUNT_FEED)
  return (feed.items || []).slice(0, 12).map((item) => {
    const name = (item.title || '').replace(/\s*[-|–].*$/, '').trim()
    return {
      source: 'producthunt',
      sourceUrl: item.link || '',
      tool: {
        slug: slugify(name),
        name: name || item.title,
        description: (item.contentSnippet || '').replace(/<[^>]+>/g, '').slice(0, 200),
        url: item.link || '',
        logoUrl: item.enclosure?.url || '',
        category: guessCategory((name || '') + ' ' + (item.contentSnippet || '')),
        tags: ['AI'],
        pricing: 'freemium',
        rating: 0,
        views: 0,
        createdAt: item.pubDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  })
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
  const draftPath = path.join(__dirname, '..', 'data', 'tools-draft.ts')
  const toolsPath = path.join(__dirname, '..', 'data', 'tools.ts')
  const items = []

  // 读取已有正式/草稿工具做去重
  const knownSlugs = new Set()
  const slugPattern = /slug[: ]*['"]([^'"]+)['"]/g
  for (const file of [draftPath, toolsPath]) {
    if (!existsSync(file)) continue
    const raw = readFileSync(file, 'utf-8')
    const matches = raw.matchAll(slugPattern)
    for (const m of matches) knownSlugs.add(m[1])
  }

  // GitHub
  for (const { topic, query } of GITHUB_QUERIES) {
    try {
      const list = await fetchGitHub(query)
      const fresh = list.filter((i) => !knownSlugs.has(i.tool.slug))
      items.push(...fresh)
      console.log(`[OK] GitHub #${topic}: +${fresh.length} 新 / ${list.length} 总`)
    } catch (e) {
      console.warn(`[FAIL] GitHub #${topic}: ${e.message}`)
    }
    // 避免 GitHub API 限流
    await new Promise((r) => setTimeout(r, 800))
  }

  // Product Hunt
  try {
    const list = await fetchProductHunt()
    const fresh = list.filter((i) => !knownSlugs.has(i.tool.slug) && i.tool.slug)
    items.push(...fresh)
    console.log(`[OK] Product Hunt AI: +${fresh.length} 新`)
  } catch (e) {
    console.warn(`[FAIL] Product Hunt AI: ${e.message}`)
  }

  // 保留已有草稿并合并(去重)
  let existing = extractArray(
    existsSync(draftPath) ? readFileSync(draftPath, 'utf-8') : '',
    'export const toolDrafts: ToolDraft[] = ['
  )
  const seen = new Set(existing.map((d) => d.tool?.slug))
  const mergedExisting = existing.filter((d) => !items.some((n) => n.tool.slug === d.tool?.slug))
  const merged = [...items, ...mergedExisting].slice(0, 60)

  const output = `// 草稿区: GitHub Actions 抓取热门 AI 工具后写入,人工在 /admin/tools 审核入库
// 抓取时间: ${new Date().toISOString()}

import type { Tool } from './tools'

export interface ToolDraft {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: Omit<Tool, 'id'> & { slug: string }
}

export const toolDrafts: ToolDraft[] = ${JSON.stringify(merged, null, 2)}
`

  writeFileSync(draftPath, output, 'utf-8')
  console.log(`\n✅ 本次新增 ${items.length} 条,草稿区共 ${merged.length} 条 → ${draftPath}`)
  console.log('⚠️ 仅写入草稿,未自动 commit。请在 /admin/tools 或本地 review 后手动入库。')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
