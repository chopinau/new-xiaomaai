'use client'

import { Search, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tool } from '@/data/tools'
import { ModelCard } from '@/components/ModelCard'

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热门' },
  { key: 'featured', label: '精选' },
]

interface ToolGridProps {
  tools: Tool[]
  filtered: Tool[]
  loading: boolean
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  query: string
  setQuery: (q: string) => void
  visibleCount: number
  setVisibleCount: (c: number | ((p: number) => number)) => void
  PAGE_SIZE: number
}

export function ToolGrid({
  filtered,
  loading,
  activeTab,
  setActiveTab,
  query,
  setQuery,
  visibleCount,
  setVisibleCount,
  PAGE_SIZE,
}: ToolGridProps) {
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-brand-purple/[0.04] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 AI 工具..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-purple/40 focus:ring-2 focus:ring-brand-purple/15"
            />
          </div>
          {(query) && (
            <button
              onClick={() => setQuery('')}
              className="whitespace-nowrap text-xs text-muted-foreground transition hover:text-brand-purple"
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{loading ? '加载中…' : `共 ${filtered.length} 个工具`}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-shimmer rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground">
          <Sparkles className="size-10 text-brand-purple/40" />
          <p className="text-sm font-medium text-foreground">没有找到匹配的工具</p>
          <button
            onClick={() => {
              setQuery('')
              setActiveTab('all')
            }}
            className="text-xs text-brand-purple transition hover:text-brand-deep"
          >
            清除筛选
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((tool, index) => (
              <ModelCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-brand-purple hover:text-brand-purple hover:shadow-md"
              >
                <span>加载更多</span>
                <span className="text-xs text-muted-foreground">剩余 {filtered.length - visibleCount} 个</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
