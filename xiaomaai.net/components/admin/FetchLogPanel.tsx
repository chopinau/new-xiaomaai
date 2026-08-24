'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Loader2,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

/**
 * 抓取请求 payload。
 * `type` 与 `source` 为 spec 规定的最小字段；`password` 用于复用现有 admin 鉴权。
 */
export type FetchPayload = {
  type: 'news' | 'tools'
  source?: string
  password?: string
}

export interface FetchLogPanelProps {
  /** 抓取接口，默认 `/api/admin/fetch` */
  endpoint?: string
  /** POST 请求体 */
  payload: FetchPayload
  /** 抓取完成回调（成功时触发，让父组件刷新草稿列表） */
  onComplete?: () => void
  /** 关闭日志区域回调 */
  onClose?: () => void
  /** 父组件传来的触发键，变化时启动新抓取（0 / undefined 时不触发） */
  triggerKey?: number
}

/** 从 SSE `data:` 行解析出的结构化数据 */
interface SSEParsed {
  done?: boolean
  ok?: boolean
  added?: number
  log?: string
  msg?: string
  message?: string
  error?: string
  reason?: string
}

/**
 * 解析单条 SSE `data:` 负载。
 * - 优先按 JSON 解析：识别 done/added/log/msg/message/error 字段
 * - 失败则当作纯文本日志返回
 */
function parseSSEData(data: string): { text: string | null; parsed: SSEParsed | null } {
  let parsed: SSEParsed | null = null
  try {
    const obj = JSON.parse(data)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      parsed = obj as SSEParsed
    }
  } catch {
    // 非纯 JSON,当作普通文本
  }
  if (parsed) {
    if (typeof parsed.log === 'string') return { text: parsed.log, parsed }
    if (typeof parsed.msg === 'string') return { text: parsed.msg, parsed }
    if (typeof parsed.message === 'string') return { text: parsed.message, parsed }
    // done / error 信号本身不当作日志输出
    if (parsed.done === true || parsed.ok === true || typeof parsed.error === 'string') {
      return { text: null, parsed }
    }
    // 未识别的 JSON 结构,回退为原始字符串
    return { text: data, parsed }
  }
  return { text: data, parsed: null }
}

/**
 * 后台「一键抓取」日志面板。
 *
 * 通过 fetch + ReadableStream 订阅 SSE 流（POST 请求,不能用 EventSource）,
 * 逐行追加日志,并在收到 `data: {"done":true,"added":N}` 时触发 onComplete。
 *
 * 兼容生产模式拦截（返回普通 JSON `{ ok:false, reason, message }`）。
 */
export default function FetchLogPanel({
  endpoint = '/api/admin/fetch',
  payload,
  onComplete,
  onClose,
  triggerKey,
}: FetchLogPanelProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const logEndRef = useRef<HTMLDivElement>(null)
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  // 日志更新或折叠状态变化时自动滚动到底
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs, collapsed])

  // triggerKey 变化时启动新抓取
  useEffect(() => {
    if (!triggerKey) return // 0 / undefined 跳过

    let cancelled = false
    const abort = new AbortController()

    const run = async () => {
      setLoading(true)
      setError(null)
      setLogs([])
      setAdded(null)

      let addedCount: number | null = null
      let errMsg: string | null = null
      let sawDone = false

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(payloadRef.current),
          signal: abort.signal,
        })

        if (cancelled) return

        // 非流式响应（生产模式拦截 / 普通 JSON 错误）
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('text/event-stream')) {
          let msg = `HTTP ${res.status}`
          try {
            const txt = await res.text()
            try {
              const j = JSON.parse(txt) as {
                ok?: boolean
                success?: boolean
                reason?: string
                message?: string
                error?: string
                added?: number
              }
              if (j.ok === false || j.success === false) {
                msg = j.message || (j.reason ? `原因: ${j.reason}` : msg)
                if (j.reason === 'production' && j.message) msg = j.message
              } else if (j.error) {
                msg = j.error
              } else if (txt) {
                msg = txt.slice(0, 200)
              }
            } catch {
              if (txt) msg = txt.slice(0, 200)
            }
          } catch {
            // ignore text read error
          }
          if (!cancelled) {
            setError(msg)
            setLoading(false)
          }
          return
        }

        if (!res.body) {
          if (!cancelled) {
            setError('响应体为空')
            setLoading(false)
          }
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let nlIdx: number
          while ((nlIdx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nlIdx).replace(/\r$/, '')
            buffer = buffer.slice(nlIdx + 1)
            if (!line) continue
            if (cancelled) break

            // SSE 数据行
            if (line.startsWith('data:')) {
              const data = line.slice(5).trimStart()
              if (!data) continue

              const { text, parsed } = parseSSEData(data)
              if (cancelled) break

              // 完成信号
              if (parsed?.done === true || parsed?.ok === true) {
                sawDone = true
                if (typeof parsed.added === 'number') addedCount = parsed.added
                if (typeof parsed.error === 'string') errMsg = parsed.error
                break
              }
              // 流中错误信号
              if (typeof parsed?.error === 'string') {
                errMsg = parsed.error
                if (text !== null) setLogs((prev) => [...prev, text])
                continue
              }
              if (text !== null) setLogs((prev) => [...prev, text])
            } else if (!line.startsWith(':')) {
              // 非 SSE / 非注释行 → 当作普通日志
              setLogs((prev) => [...prev, line])
            }
            // 以 `:` 开头的行是 SSE 注释 / 心跳,忽略
          }
          if (sawDone) break
        }

        if (cancelled) return

        setLoading(false)
        if (sawDone) {
          if (addedCount !== null) setAdded(addedCount)
          if (errMsg) {
            setError(errMsg)
          } else {
            onComplete?.()
          }
        } else if (errMsg) {
          setError(errMsg)
        } else {
          setError('抓取流异常结束')
        }
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err?.name === 'AbortError') return
        if (!cancelled) {
          setError(err?.message || '网络错误')
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      abort.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, endpoint])

  // 顶部状态条文案
  const statusText = error
    ? `失败: ${error}`
    : loading
      ? '抓取中...'
      : added !== null
        ? `完成 (新增 ${added} 条)`
        : '空闲'

  const statusColor = error
    ? 'text-red-600'
    : loading
      ? 'text-brand-purple'
      : added !== null
        ? 'text-emerald-600'
        : 'text-muted-foreground'

  const statusIcon = error ? (
    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
  ) : loading ? (
    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-purple" />
  ) : added !== null ? (
    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
  ) : null

  return (
    <Card className="gap-0 overflow-hidden border-border bg-card p-0">
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {statusIcon}
          <span className={`truncate text-sm font-medium ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? '展开日志' : '折叠日志'}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="关闭日志"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 日志区域 */}
      {!collapsed && (
        <div className="h-[300px] overflow-y-auto bg-zinc-950 px-4 py-3">
          {logs.length === 0 ? (
            <div className="font-mono text-xs leading-relaxed text-zinc-500">
              {loading ? '等待日志...' : '点击「一键抓取」按钮开始...'}
            </div>
          ) : (
            <div className="font-mono text-xs leading-relaxed text-zinc-300">
              {logs.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))}
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </Card>
  )
}
