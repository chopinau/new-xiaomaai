export const runtime = 'edge'

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

// GET /api/admin/settings — 读取 LLM 配置
export async function GET() {
  const fs = nodeRequire('node:fs')
  const path = nodeRequire('node:path')
  if (!fs || !path) {
    return NextResponse.json({ apiKey: '', apiUrl: '', model: '' })
  }
  try {
    const configPath = path.join(process.cwd(), 'data', 'llm-config.json')
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(raw)
      // 不返回完整 key，只返回掩码
      const maskedKey = config.apiKey
        ? config.apiKey.slice(0, 8) + '••••••' + config.apiKey.slice(-4)
        : ''
      return NextResponse.json({ ...config, apiKeyMasked: maskedKey, hasKey: !!config.apiKey })
    }
  } catch {}
  return NextResponse.json({ apiKey: '', apiUrl: '', model: '', hasKey: false })
}

// POST /api/admin/settings — 保存 LLM 配置
export async function POST(req: NextRequest) {
  const fs = nodeRequire('node:fs')
  const path = nodeRequire('node:path')
  if (!fs || !path) {
    return NextResponse.json({ error: 'Node.js runtime 不可用' }, { status: 500 })
  }
  try {
    const body = await req.json()
    const configPath = path.join(process.cwd(), 'data', 'llm-config.json')
    // 读取现有配置
    let existing: any = {}
    try {
      if (fs.existsSync(configPath)) {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      }
    } catch {}

    // 如果前端传了 apiKeyMasked 字段（即用户未修改 key），保留原有 key
    const newConfig = {
      apiUrl: body.apiUrl || existing.apiUrl || '',
      apiKey: body.apiKey || existing.apiKey || '',
      model: body.model || existing.model || 'gpt-4o-mini',
      updatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, hasKey: !!newConfig.apiKey })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
