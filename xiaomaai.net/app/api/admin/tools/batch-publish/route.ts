export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'


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

function extractArray(raw: string, marker: string): ToolDraft[] {
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

  const insertAt = raw.indexOf('[', idx) + 1
  const updated = raw.slice(0, insertAt) + '\n' + entry + raw.slice(insertAt)
  writeFileSync(TOOLS_FILE, updated, 'utf-8')
}

// POST /api/admin/tools/batch-publish
// body: { slugs: string[]; password: string; action: 'publish' | 'discard'; category?: string; tags?: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slugs, password, action, category, tags } = body || {}

    const expected = process.env.ADMIN_PASSWORD || 'admin123'
    if (password !== expected) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
    }
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ success: false, error: 'slugs 必须是非空数组' }, { status: 400 })
    }
    if (action !== 'publish' && action !== 'discard') {
      return NextResponse.json({ success: false, error: 'action 必须是 publish 或 discard' }, { status: 400 })
    }

    const drafts = readDrafts()
    const slugSet = new Set(slugs)
    const results: Array<{ slug: string; ok: boolean; error?: string }> = []
    const remaining: ToolDraft[] = []

    for (const d of drafts) {
      const slug = d.tool?.slug
      if (!slug || !slugSet.has(slug)) {
        remaining.push(d)
        continue
      }
      try {
        if (action === 'publish') {
          appendToTools(d, { category, tags })
        }
        results.push({ slug, ok: true })
      } catch (e) {
        results.push({
          slug,
          ok: false,
          error: e instanceof Error ? e.message : '处理失败',
        })
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
