export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'


export const dynamic = 'force-dynamic'

// 从 TS 文件中提取 export const xxx: Type[] = [...] 数组(括号匹配,忽略字符串内括号)
// 注意: 数组内容由 JSON.stringify 生成,字符串统一用双引号,故只识别双引号边界
function extractArray(raw: string, marker: string): unknown[] {
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

// 读取 data/tools-draft.ts 中的草稿数组
function readDrafts(): unknown[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'tools-draft.ts')
    const raw = readFileSync(filePath, 'utf-8')
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
  // 默认按 fetchedAt desc
  drafts = [...drafts].sort((a, b) => (b.fetchedAt || '').localeCompare(a.fetchedAt || ''))
  return NextResponse.json({ success: true, total: drafts.length, data: drafts })
}
