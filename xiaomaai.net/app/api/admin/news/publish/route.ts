import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

export const runtime = 'edge';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DRAFT_FILE = path.join(process.cwd(), 'data', 'news-draft.ts')
const NEWS_FILE = path.join(process.cwd(), 'data', 'news.ts')

type NewsDraft = {
  id: string
  title: string
  source: string
  url: string
  summary: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

// 从 TS 文件中提取 export const xxx: Type[] = [...] 数组(括号匹配,忽略字符串内括号)
// 注意: 数组内容由 JSON.stringify 生成,字符串统一用双引号,故只识别双引号边界
function extractArray(raw: string, marker: string): NewsDraft[] {
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

function readDrafts(): NewsDraft[] {
  try {
    const raw = readFileSync(DRAFT_FILE, 'utf-8')
    return extractArray(raw, 'export const newsDrafts: NewsDraft[] = [')
  } catch {
    return []
  }
}

function writeDrafts(drafts: NewsDraft[]) {
  const output = `// 草稿区: GitHub Actions 自动抓取写入,人工在 /admin/news 审核发布
// 本文件会被 scripts/fetch-news.mjs 定时覆盖,请勿手工编辑数据

export interface NewsDraft {
  id: string
  title: string
  source: string
  url: string
  summary: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

export const newsDrafts: NewsDraft[] = ${JSON.stringify(drafts, null, 2)}

export function getNewsDrafts(): NewsDraft[] {
  return newsDrafts
}
`
  writeFileSync(DRAFT_FILE, output, 'utf-8')
}

function escapeSingleQuote(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// 把一条草稿写入 data/news.ts(插入数组头部)
function appendToNews(item: NewsDraft) {
  const raw = readFileSync(NEWS_FILE, 'utf-8')
  const marker = 'export const newsItems: NewsItem[] = ['
  const idx = raw.indexOf(marker)
  if (idx === -1) throw new Error('data/news.ts 格式异常: 找不到 newsItems 数组')

  const date = (item.publishedAt || '').slice(0, 10)
  const entry = `  {
    id: '${escapeSingleQuote(item.id)}',
    date: '${escapeSingleQuote(date)}',
    title: '${escapeSingleQuote(item.title)}',
    summary: '${escapeSingleQuote(item.summary)}',
    category: '${escapeSingleQuote(item.category)}',
    source: '${escapeSingleQuote(item.source)}',
    url: '${escapeSingleQuote(item.url)}',
  },`

  const insertAt = raw.indexOf('[', idx) + 1
  const updated = raw.slice(0, insertAt) + '\n' + entry + raw.slice(insertAt)
  writeFileSync(NEWS_FILE, updated, 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, password, action } = body || {}

    const expected = process.env.ADMIN_PASSWORD || 'admin123'
    if (password !== expected) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少草稿 id' }, { status: 400 })
    }

    const drafts = readDrafts()
    const draft = drafts.find((d) => d.id === id)
    if (!draft) {
      return NextResponse.json({ success: false, error: '草稿不存在或已处理' }, { status: 404 })
    }

    if (action === 'discard') {
      // 丢弃: 仅从草稿区删除
      writeDrafts(drafts.filter((d) => d.id !== id))
      return NextResponse.json({ success: true, message: '已丢弃' })
    }

    // 发布: 写入 data/news.ts 并从草稿区删除
    appendToNews(draft)
    writeDrafts(drafts.filter((d) => d.id !== id))
    return NextResponse.json({ success: true, message: '已发布到 data/news.ts' })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '服务器错误' },
      { status: 500 }
    )
  }
}
