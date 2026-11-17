// Cloudflare Pages/OpenNext 要求非静态路由使用 Edge Runtime。
// 文件系统仅本地 dev 可用：用 eval 隐藏 require，避免 webpack 打包 node 原生模块。
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

async function readDrafts(): Promise<unknown[]> {
  try {
    const fs = nodeRequire('fs')
    const path = nodeRequire('path')
    if (!fs || !path) return []
    const filePath = path.join(process.cwd(), 'data', 'news-draft.ts')
    const raw = await fs.promises.readFile(filePath, 'utf-8')
    return extractArray(raw, 'export const newsDrafts: NewsDraft[] = [')
  } catch {
    return []
  }
}

// GET /api/admin/news?password=xxx[&source=xxx][&search=xxx] → 返回草稿列表(需密码)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const password = searchParams.get('password') || ''
  const source = searchParams.get('source') || ''
  const search = (searchParams.get('search') || '').toLowerCase()
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  if (password !== expected) {
    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
  }

  if (!nodeRequire('fs') || !nodeRequire('path')) {
    return NextResponse.json(
      { success: false, error: '边缘环境不支持文件系统操作，请在本地开发环境使用' },
      { status: 503 }
    )
  }

  let drafts = (await readDrafts()) as Array<{ id: string; title: string; source: string; summary: string; fetchedAt: string; publishedAt: string }>
  if (source) drafts = drafts.filter((d) => d.source === source)
  if (search) {
    drafts = drafts.filter(
      (d) => d.title?.toLowerCase().includes(search) || d.summary?.toLowerCase().includes(search)
    )
  }
  drafts = [...drafts].sort((a, b) => (b.fetchedAt || '').localeCompare(a.fetchedAt || ''))
  // 列表不返回 content（全文 HTML 太大），预览时按需获取
  const listData = drafts.map(({ content, ...rest }) => rest)
  return NextResponse.json({ success: true, total: listData.length, data: listData })
}
