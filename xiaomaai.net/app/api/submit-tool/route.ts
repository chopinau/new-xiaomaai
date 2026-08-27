export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'

// 隐藏 require 调用，避免 webpack 打包 Node.js 原生模块
function nodeRequire(name: string): any {
  try {
    return (0, eval)('require')(name)
  } catch {
    return null
  }
}

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

    const fs = nodeRequire('fs')
    const path = nodeRequire('path')
    if (!fs || !path) {
      return NextResponse.json(
        { success: false, message: '边缘环境不支持文件系统操作，请在本地开发环境使用' },
        { status: 503 },
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
      const raw = fs.readFileSync(filePath, 'utf-8')
      existing = JSON.parse(raw)
      if (!Array.isArray(existing)) existing = []
    } catch {
      existing = []
    }

    existing.unshift(entry)
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: '提交成功' })
  } catch (error) {
    console.error('[submit-tool] error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 },
    )
  }
}
