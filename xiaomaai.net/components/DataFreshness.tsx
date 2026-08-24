"use client"

/**
 * 数据新鲜度徽章
 * 展示 modelPricing.ts 的最后同步时间和数据源
 * 自动根据时间显示不同状态：
 *   - < 7 天: 绿色（新鲜）
 *   - 7-30 天: 黄色（一般）
 *   - > 30 天: 红色（过时）
 */
import { useEffect, useState } from 'react'

type SyncMeta = {
  lastSyncAt: string
  lastSyncDate: string
  modelCount: number
  sources: { litellm: number; openrouter: number }
  exchangeRate: number
  commitSha?: string | null
  runId?: string | null
}

type Status = 'fresh' | 'stale' | 'outdated'

function calcStatus(dateStr: string): Status {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days < 7) return 'fresh'
  if (days < 30) return 'stale'
  return 'outdated'
}

const STATUS_STYLES: Record<Status, { dot: string; bg: string; text: string; label: string }> = {
  fresh: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    label: '新鲜',
  },
  stale: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    label: '一般',
  },
  outdated: {
    dot: 'bg-rose-500',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    label: '过时',
  },
}

export function DataFreshness({
  meta: metaProp,
  variant = 'badge',
}: {
  meta?: SyncMeta | null
  variant?: 'badge' | 'inline' | 'detailed'
}) {
  const [meta, setMeta] = useState<SyncMeta | null>(metaProp ?? null)
  const [loading, setLoading] = useState(!metaProp)

  useEffect(() => {
    if (metaProp) return
    // 客户端首次加载：拉取元数据
    fetch('/sync-meta.json')
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        setMeta(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [metaProp])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
        加载中...
      </span>
    )
  }

  if (!meta) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        数据源未配置
      </span>
    )
  }

  const status = calcStatus(meta.lastSyncDate)
  const styles = STATUS_STYLES[status]
  const daysAgo = Math.floor((Date.now() - new Date(meta.lastSyncDate).getTime()) / 86400000)

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${styles.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        数据更新于 {meta.lastSyncDate} ({daysAgo === 0 ? '今天' : `${daysAgo} 天前`})
      </span>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles.bg} text-xs`}>
        <span className={`w-2 h-2 rounded-full ${styles.dot} ${status === 'fresh' ? 'animate-pulse' : ''}`} />
        <span className={`font-medium ${styles.text}`}>{styles.label}</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-700">
          {meta.lastSyncDate} ({daysAgo === 0 ? '今天' : `${daysAgo} 天前`})
        </span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">{meta.modelCount} 个模型</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">
          来源: LiteLLM ({meta.sources.litellm}) + OpenRouter ({meta.sources.openrouter})
        </span>
      </div>
    )
  }

  // 默认 badge 样式
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${styles.bg} text-xs`}
      title={`LiteLLM (${meta.sources.litellm}) + OpenRouter (${meta.sources.openrouter}) · ${meta.modelCount} 个模型`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      <span className={styles.text}>
        {meta.lastSyncDate} 同步
      </span>
    </span>
  )
}

/**
 * 紧凑型（用于卡片内）
 */
export function DataFreshnessCompact({ meta }: { meta?: SyncMeta | null }) {
  const [m, setM] = useState<SyncMeta | null>(meta ?? null)
  useEffect(() => {
    if (meta) return
    fetch('/sync-meta.json')
      .then(r => r.ok ? r.json() : null)
      .then(setM)
      .catch(() => {})
  }, [meta])
  if (!m) return null
  return (
    <span className="text-[10px] text-gray-400">
      数据 {m.lastSyncDate.slice(5)} 更新
    </span>
  )
}
