export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, description, category, tags } = body

    if (!name || !url) {
      return NextResponse.json(
        { success: false, message: '工具名称和官网 URL 为必填字段' },
        { status: 400 },
      )
    }

    const entry = {
      name,
      url,
      description: description || '',
      category: category || 'chat',
      tags: tags || '',
      submittedAt: new Date().toISOString(),
    }

    const filePath = path.join(process.cwd(), 'data', 'submitted-tools.json')

    let existing: typeof entry[] = []
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      existing = JSON.parse(raw)
      if (!Array.isArray(existing)) existing = []
    } catch {
      existing = []
    }

    existing.unshift(entry)
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: '提交成功' })
  } catch (error) {
    console.error('[submit-tool] error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 },
    )
  }
}
