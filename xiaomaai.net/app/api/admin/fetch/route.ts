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

// POST /api/admin/fetch — 统一抓取入口(dev 模式 spawn 脚本,生产模式拦截)
const NEWS_SCRIPT = 'scripts/fetch-news.mjs'

const TOOL_SCRIPTS: Record<string, string> = {
  faxianai: 'scripts/import-faxianai.mjs',
  toolify: 'scripts/import-toolify.mjs',
  aitaaft: 'scripts/import-aitaaft.mjs',
  futurepedia: 'scripts/import-futurepedia.mjs',
  aibase: 'scripts/import-aibase.mjs',
  'ai-bot': 'scripts/import-ai-bot.mjs',
  'ai-nav': 'scripts/import-ai-nav.mjs',
}

const ALL_TOOL_SOURCES = [
  'faxianai',
  'toolify',
  'aitaaft',
  'futurepedia',
  'aibase',
  'ai-bot',
  'ai-nav',
]

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

function parseAdded(line: string): string | null {
  const m = line.match(/新增\s*(\d+)\s*条/)
  return m ? m[1] : null
}

function runScript(
  scriptPath: string,
  send: (obj: Record<string, unknown>) => void
): Promise<{ code: number; added: string }> {
  return new Promise((resolve) => {
    const cp = nodeRequire('child_process')
    if (!cp) {
      send({ line: '[error] child_process 不可用(边缘环境)', stderr: true })
      resolve({ code: 1, added: 'unknown' })
      return
    }
    const child = cp.spawn('node', [scriptPath], { cwd: process.cwd() })
    let added = 'unknown'

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      for (const raw of text.split('\n')) {
        const line = raw.replace(/\r$/, '')
        if (line === '') continue
        send({ line })
        const n = parseAdded(line)
        if (n) added = n
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      for (const raw of text.split('\n')) {
        const line = raw.replace(/\r$/, '')
        if (line === '') continue
        send({ line, stderr: true })
      }
    })

    child.on('error', (e) => {
      send({ line: `[spawn error] ${e.message}`, stderr: true })
      resolve({ code: 1, added: 'unknown' })
    })

    child.on('close', (code) => {
      resolve({ code: code ?? 0, added })
    })
  })
}

export async function POST(request: NextRequest) {
  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: '请求 body 不是合法 JSON' },
      { status: 400 }
    )
  }
  const { type, source, password } = (parsed || {}) as {
    type?: string
    source?: string
    password?: string
  }

  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  if (password !== expected) {
    return NextResponse.json({ ok: false, error: '密码错误' }, { status: 401 })
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      ok: false,
      reason: 'production',
      message: '请在本地运行 npm run dev 后访问 /admin/... 一键抓取',
    })
  }

  if (type !== 'news' && type !== 'tools') {
    return NextResponse.json(
      { ok: false, error: "type 必须为 'news' 或 'tools'" },
      { status: 400 }
    )
  }

  let scripts: { name: string; path: string }[]
  if (type === 'news') {
    scripts = [{ name: 'news', path: NEWS_SCRIPT }]
  } else {
    if (source === 'all') {
      scripts = ALL_TOOL_SOURCES.map((s) => ({ name: s, path: TOOL_SCRIPTS[s] }))
    } else {
      const scriptPath = source ? TOOL_SCRIPTS[source] : undefined
      if (!scriptPath) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'source 不合法,支持: faxianai/toolify/aitaaft/futurepedia/aibase/ai-bot/ai-nav/all',
          },
          { status: 400 }
        )
      }
      scripts = [{ name: source as string, path: scriptPath }]
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        if (scripts.length === 1) {
          const { path } = scripts[0]
          const { code, added } = await runScript(path, send)
          if (code === 0) {
            send({ done: true, added })
          } else {
            send({ done: true, error: `exit code ${code}` })
          }
        } else {
          const summaryParts: string[] = []
          for (const { name, path } of scripts) {
            send({ line: `--- 运行 ${name} ---` })
            const { code, added } = await runScript(path, send)
            if (code === 0) {
              send({ script: name, done: true, added })
              summaryParts.push(`${name}:done`)
            } else {
              send({ script: name, done: true, error: `exit code ${code}` })
              summaryParts.push(`${name}:error`)
            }
          }
          send({ done: true, summary: summaryParts.join('|') })
        }
      } catch (e) {
        send({
          done: true,
          error: e instanceof Error ? e.message : '未知错误',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
