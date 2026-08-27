export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 隐藏 require 调用，避免 webpack 打包 Node.js 原生模块
function nodeRequire(name: string): any {
  try {
    return (0, eval)('require')(name)
  } catch {
    return null
  }
}

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

function getFilePaths() {
  const path = nodeRequire('path')
  if (!path) return null
  return {
    draftFile: path.join(process.cwd(), 'data', 'tools-draft.ts'),
    toolsFile: path.join(process.cwd(), 'data', 'tools.ts'),
  }
}

function readDrafts(): ToolDraft[] {
  try {
    const fs = nodeRequire('fs')
    const paths = getFilePaths()
    if (!fs || !paths) return []
    const raw = fs.readFileSync(paths.draftFile, 'utf-8')
    return extractArray(raw, 'export const toolDrafts: ToolDraft[] = [')
  } catch {
    return []
  }
}

function writeDrafts(drafts: ToolDraft[]) {
  const fs = nodeRequire('fs')
  const paths = getFilePaths()
  if (!fs || !paths) return
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
  fs.writeFileSync(paths.draftFile, output, 'utf-8')
}

function escapeSingleQuote(s: string) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function appendToTools(draft: ToolDraft, overrides: { category?: string; tags?: string[] }) {
  const fs = nodeRequire('fs')
  const paths = getFilePaths()
  if (!fs || !paths) throw new Error('文件系统不可用')
  const raw = fs.readFileSync(paths.toolsFile, 'utf-8')
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
  fs.writeFileSync(paths.toolsFile, updated, 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const fs = nodeRequire('fs')
    const path = nodeRequire('path')
    if (!fs || !path) {
      return NextResponse.json(
        { success: false, error: '边缘环境不支持文件系统操作，请在本地开发环境使用' },
        { status: 503 }
      )
    }

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
