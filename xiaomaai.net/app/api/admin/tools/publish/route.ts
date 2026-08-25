import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

export const runtime = 'edge';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DRAFT_FILE = path.join(process.cwd(), 'data', 'tools-draft.ts')
const TOOLS_FILE = path.join(process.cwd(), 'data', 'tools.ts')

type ToolDraft = {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: {
    slug: string
    name: string
    description: string
    url: string
    logoUrl?: string
    category: string
    tags: string[]
    pricing: string
    rating?: number
    views?: number
    createdAt?: string
    updatedAt?: string
  }
}

// 从 TS 文件中提取 export const xxx: Type[] = [...] 数组(括号匹配,忽略字符串内括号)
// 注意: 数组内容由 JSON.stringify 生成,字符串统一用双引号,故只识别双引号边界
function extractArray(raw: string, marker: string): ToolDraft[] {
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

function readDrafts(): ToolDraft[] {
  try {
    const raw = readFileSync(DRAFT_FILE, 'utf-8')
    return extractArray(raw, 'export const toolDrafts: ToolDraft[] = [')
  } catch {
    return []
  }
}

function writeDrafts(drafts: ToolDraft[]) {
  const output = `// 草稿区: GitHub Actions 抓取热门 AI 工具后写入,人工在 /admin/tools 审核入库
// 本文件会被 scripts/fetch-trending.mjs 定时覆盖,请勿手工编辑数据

import type { Tool } from './tools'

export interface ToolDraft {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: Omit<Tool, 'id'> & { slug: string }
}

export const toolDrafts: ToolDraft[] = ${JSON.stringify(drafts, null, 2)}
`
  writeFileSync(DRAFT_FILE, output, 'utf-8')
}

function escapeSingleQuote(s: string) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// 把一条草稿写入 data/tools.ts(插入数组头部)
function appendToTools(draft: ToolDraft, overrides: { category?: string; tags?: string[] }) {
  const raw = readFileSync(TOOLS_FILE, 'utf-8')
  const marker = 'export const tools: Tool[] = ['
  const idx = raw.indexOf(marker)
  if (idx === -1) throw new Error('data/tools.ts 格式异常: 找不到 tools 数组')

  const t = draft.tool
  const now = new Date().toISOString()
  const category = overrides.category || t.category
  const tags = overrides.tags || t.tags || []
  const id = t.slug

  const entry = `  {
    id: '${escapeSingleQuote(id)}',
    slug: '${escapeSingleQuote(t.slug)}',
    name: '${escapeSingleQuote(t.name)}',
    description: '${escapeSingleQuote(t.description)}',
    url: '${escapeSingleQuote(t.url)}',
    logoUrl: '${escapeSingleQuote(t.logoUrl || '')}',
    category: '${escapeSingleQuote(category)}',
    tags: [${tags.map((x) => `"${escapeSingleQuote(x)}"`).join(', ')}],
    pricing: '${escapeSingleQuote(t.pricing || 'freemium')}',
    featured: false,
    rating: ${typeof t.rating === 'number' ? t.rating : 0},
    views: ${typeof t.views === 'number' ? t.views : 0},
    createdAt: '${escapeSingleQuote(t.createdAt || now)}',
    updatedAt: '${escapeSingleQuote(now)}',
  },`

  const insertAt = raw.indexOf('[', raw.indexOf('=', idx)) + 1
  const updated = raw.slice(0, insertAt) + '\n' + entry + raw.slice(insertAt)
  writeFileSync(TOOLS_FILE, updated, 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, password, action, category, tags } = body || {}

    const expected = process.env.ADMIN_PASSWORD || 'admin123'
    if (password !== expected) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
    }
    if (!slug) {
      return NextResponse.json({ success: false, error: '缺少 slug' }, { status: 400 })
    }

    const drafts = readDrafts()
    const draft = drafts.find((d) => d.tool?.slug === slug)
    if (!draft) {
      return NextResponse.json({ success: false, error: '草稿不存在或已处理' }, { status: 404 })
    }

    if (action === 'discard') {
      writeDrafts(drafts.filter((d) => d.tool?.slug !== slug))
      return NextResponse.json({ success: true, message: '已丢弃' })
    }

    // 入库: 写入 data/tools.ts 并从草稿区删除
    appendToTools(draft, { category, tags })
    writeDrafts(drafts.filter((d) => d.tool?.slug !== slug))
    return NextResponse.json({ success: true, message: '已入库到 data/tools.ts' })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '服务器错误' },
      { status: 500 }
    )
  }
}
