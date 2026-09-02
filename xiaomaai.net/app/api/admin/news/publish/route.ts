// 仅限本地开发环境使用，需要文件系统读写能力
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

type NewsDraft = {
  id: string
  title: string
  source: string
  url: string
  summary: string
  content: string
  coverImage?: string
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

function getFilePaths() {
  return {
    draftFile: path.join(process.cwd(), 'data', 'news-draft.ts'),
    newsFile: path.join(process.cwd(), 'data', 'news.ts'),
  }
}

async function readDrafts(): Promise<NewsDraft[]> {
  try {
    const paths = getFilePaths()
    const raw = await fs.readFile(paths.draftFile, 'utf-8')
    return extractArray(raw, 'export const newsDrafts: NewsDraft[] = [')
  } catch {
    return []
  }
}

async function writeDrafts(drafts: NewsDraft[]) {
  const paths = getFilePaths()
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
  await fs.writeFile(paths.draftFile, output, 'utf-8')
}

function parseRSSDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10)
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
    return d.toISOString().slice(0, 10)
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

async function appendToNews(item: NewsDraft) {
  const paths = getFilePaths()
  const raw = await fs.readFile(paths.newsFile, 'utf-8')
  const marker = 'export const newsItems: NewsItem[] = ['
  const idx = raw.indexOf(marker)
  if (idx === -1) throw new Error('data/news.ts 格式异常: 找不到 newsItems 数组')

  const date = parseRSSDate(item.publishedAt)
  // 用 JSON.stringify 正确转义所有特殊字符（换行、反引号、引号等）
  const entry = `  {
    id: ${JSON.stringify(item.id)},
    date: ${JSON.stringify(date)},
    title: ${JSON.stringify(item.title)},
    summary: ${JSON.stringify(item.summary)},
    content: ${JSON.stringify(item.content || '')},
    coverImage: ${JSON.stringify(item.coverImage || '')},
    category: ${JSON.stringify(item.category)},
    source: ${JSON.stringify(item.source)},
    url: ${JSON.stringify(item.url)},
  },`

  const insertAt = idx + marker.length
  const updated = raw.slice(0, insertAt) + '\n' + entry + raw.slice(insertAt)
  await fs.writeFile(paths.newsFile, updated, 'utf-8')
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

    const drafts = await readDrafts()
    const draft = drafts.find((d) => d.id === id)
    if (!draft) {
      return NextResponse.json({ success: false, error: '草稿不存在或已处理' }, { status: 404 })
    }

    if (action === 'discard') {
      await writeDrafts(drafts.filter((d) => d.id !== id))
      return NextResponse.json({ success: true, message: '已丢弃' })
    }

    await appendToNews(draft)
    await writeDrafts(drafts.filter((d) => d.id !== id))
    return NextResponse.json({ success: true, message: '已发布到 data/news.ts' })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '服务器错误' },
      { status: 500 }
    )
  }
}