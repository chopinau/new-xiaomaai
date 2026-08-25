import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'edge';

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

// 读取 data/news-draft.ts 中的草稿数组(文件由 fetch-news.mjs 生成,数组为标准 JSON 格式)
function readDrafts(): unknown[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'news-draft.ts')
    const raw = readFileSync(filePath, 'utf-8')
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
  let drafts = readDrafts() as Array<{ id: string; title: string; source: string; summary: string; fetchedAt: string; publishedAt: string }>
  if (source) drafts = drafts.filter((d) => d.source === source)
  if (search) {
    drafts = drafts.filter(
      (d) => d.title?.toLowerCase().includes(search) || d.summary?.toLowerCase().includes(search)
    )
  }
  // 默认按 fetchedAt desc
  drafts = [...drafts].sort((a, b) => (b.fetchedAt || '').localeCompare(a.fetchedAt || ''))
  return NextResponse.json({ success: true, total: drafts.length, data: drafts })
}
