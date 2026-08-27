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

function extractArray(raw: string, marker: string): unknown[] {
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

function readDrafts(): unknown[] {
  try {
    const fs = nodeRequire('fs')
    const path = nodeRequire('path')
    if (!fs || !path) return []
    const filePath = path.join(process.cwd(), 'data', 'tools-draft.ts')
    const raw = fs.readFileSync(filePath, 'utf-8')
    return extractArray(raw, 'export const toolDrafts: ToolDraft[] = [')
  } catch {
    return []
  }
}

// GET /api/admin/tools?password=xxx[&source=xxx][&search=xxx] → 返回工具草稿列表(需密码)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const password = searchParams.get('password') || ''
  const source = searchParams.get('source') || ''
  const search = (searchParams.get('search') || '').toLowerCase()
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  if (password !== expected) {
    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
  }

  const fs = nodeRequire('fs')
  const path = nodeRequire('path')
  if (!fs || !path) {
    return NextResponse.json(
      { success: false, error: '边缘环境不支持文件系统操作，请在本地开发环境使用' },
      { status: 503 }
    )
  }

  let drafts = readDrafts() as Array<{ source: string; fetchedAt: string; tool: { slug: string; name: string; description: string } }>
  if (source) drafts = drafts.filter((d) => d.source === source)
  if (search) {
    drafts = drafts.filter((d) => {
      const t = d.tool || ({} as any)
      return (
        t.name?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.slug?.toLowerCase().includes(search)
      )
    })
  }
  drafts = [...drafts].sort((a, b) => (b.fetchedAt || '').localeCompare(a.fetchedAt || ''))
  return NextResponse.json({ success: true, total: drafts.length, data: drafts })
}
