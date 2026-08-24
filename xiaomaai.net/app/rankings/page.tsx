'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { RankingCard } from '@/components/RankingCard'
import { TrendingUp, Loader2, Trophy } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { cn } from '@/lib/utils'

type PeriodKey = 'weekly' | 'monthly' | 'alltime'
type CategoryKey = 'all' | 'image' | 'chat' | 'video' | 'productivity' | 'audio' | 'code' | 'research'

const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'alltime', label: '总榜' },
]

const CATEGORY_TABS: { key: CategoryKey; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '🌐' },
  { key: 'image', label: '图像 AI', icon: '🎨' },
  { key: 'chat', label: '对话 AI', icon: '💬' },
  { key: 'video', label: '视频 AI', icon: '🎬' },
  { key: 'productivity', label: '办公 AI', icon: '📊' },
  { key: 'audio', label: '音频 AI', icon: '🎵' },
  { key: 'code', label: '开发 AI', icon: '💻' },
  { key: 'research', label: '论文 AI', icon: '📚' },
]

const LS_WEEKLY_KEY = 'xiaoma_ranking_weekly'
const LS_MONTHLY_KEY = 'xiaoma_ranking_monthly'

interface SnapshotEntry {
  slug: string
  rank: number
}

interface Snapshot {
  date: string
  rankings: SnapshotEntry[]
}

export default function RankingsPage() {
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('weekly')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [snapshots, setSnapshots] = useState<{ weekly: Snapshot[]; monthly: Snapshot[] }>({
    weekly: [],
    monthly: [],
  })

  useEffect(() => {
    fetch('/api/tools?limit=500')
      .then((r) => r.json())
      .then((res) => {
        setAllTools(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // 读快照
  useEffect(() => {
    try {
      const weekly = JSON.parse(localStorage.getItem(LS_WEEKLY_KEY) || '[]') as Snapshot[]
      const monthly = JSON.parse(localStorage.getItem(LS_MONTHLY_KEY) || '[]') as Snapshot[]
      setSnapshots({ weekly, monthly })
    } catch {
      // ignore
    }
  }, [])

  // 排名公式: views*0.6 + rating*40
  const ranked = useMemo(() => {
    let result = allTools
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory)
    }
    return result
      .map((t) => ({ ...t, score: (t.views || 0) * 0.6 + (t.rating || 0) * 40 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [allTools, activeCategory])

  // 上升最快
  const risingFast = useCallback((tool: Tool) => {
    const snap = activePeriod === 'weekly' ? snapshots.weekly : snapshots.monthly
    if (snap.length < 2) return 0
    const last = snap[snap.length - 1]?.rankings.find((e) => e.slug === tool.slug)?.rank
    const prev = snap[snap.length - 2]?.rankings.find((e) => e.slug === tool.slug)?.rank
    if (!last || !prev) return 0
    return prev - last
  }, [activePeriod, snapshots])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-brand-purple" />
        <p className="text-sm text-muted-foreground">加载排行榜…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-orange-500/5 p-8 shadow-card sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-md">
              <Trophy className="size-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              AI 工具排行榜
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              按"浏览量×0.6 + 评分×40"加权排序 · 7 大细分赛道 · 每日更新
            </p>
          </div>
        </section>

        {/* 赛道 tab */}
        <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-xl bg-brand-purple/[0.04] p-1">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                activeCategory === cat.key
                  ? 'bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
              )}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 时段 tab */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePeriod(tab.key)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                  activePeriod === tab.key
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>当前赛道 TOP 10</span>
          </div>
        </div>

        {/* 排行榜 */}
        {ranked.length > 0 ? (
          <div className="mt-6 space-y-2">
            {ranked.map((tool, i) => (
              <div key={tool.id} className="relative">
                {/* 排名徽章 */}
                {i < 3 && (
                  <div
                    className={cn(
                      'absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md',
                      i === 0 && 'bg-gradient-to-br from-yellow-400 to-amber-500',
                      i === 1 && 'bg-gradient-to-br from-slate-300 to-slate-400',
                      i === 2 && 'bg-gradient-to-br from-orange-300 to-orange-500'
                    )}
                  >
                    {i + 1}
                  </div>
                )}
                {i >= 3 && (
                  <div className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card text-xs font-bold text-muted-foreground shadow-md ring-1 ring-border">
                    {i + 1}
                  </div>
                )}
                <RankingCard tool={tool} rank={i + 1} rise={risingFast(tool)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
            该赛道暂无工具
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
