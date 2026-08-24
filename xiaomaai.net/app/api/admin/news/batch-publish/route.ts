import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

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

function extractArray(raw: string, marker: string): NewsDraft[] {
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
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
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

// POST /api/admin/news/batch-publish
// body: { ids: string[]; password: string; action: 'publish' | 'discard' }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, password, action } = body || {}

    const expected = process.env.ADMIN_PASSWORD || 'admin123'
    if (password !== expected) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids 必须是非空数组' }, { status: 400 })
    }
    if (action !== 'publish' && action !== 'discard') {
      return NextResponse.json({ success: false, error: 'action 必须是 publish 或 discard' }, { status: 400 })
    }

    const drafts = readDrafts()
    const idSet = new Set(ids)
    const results: Array<{ id: string; ok: boolean; error?: string }> = []
    const remaining: NewsDraft[] = []

    for (const d of drafts) {
      if (!idSet.has(d.id)) {
        remaining.push(d)
        continue
      }
      try {
        if (action === 'publish') {
          appendToNews(d)
        }
        results.push({ id: d.id, ok: true })
      } catch (e) {
        results.push({
          id: d.id,
          ok: false,
          error: e instanceof Error ? e.message : '处理失败',
        })
        // 失败的保留在草稿区
        remaining.push(d)
      }
    }

    writeDrafts(remaining)

    const successCount = results.filter((r) => r.ok).length
    const failCount = results.length - successCount

    return NextResponse.json({
      success: failCount === 0,
      message: `成功 ${successCount} 条,失败 ${failCount} 条`,
      total: results.length,
      successCount,
      failCount,
      results,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '服务器错误' },
      { status: 500 }
    )
  }
}
