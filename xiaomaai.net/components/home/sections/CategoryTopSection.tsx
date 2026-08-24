'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tool } from '@/data/tools'
import { ModelCard } from '@/components/ModelCard'

interface CategoryTopSectionProps {
  tools: Tool[]
}

const CATEGORIES = [
  { key: 'image', label: '图像 AI' },
  { key: 'chat', label: '对话 AI' },
  { key: 'video', label: '视频 AI' },
  { key: 'productivity', label: '办公 AI' },
  { key: 'audio', label: '音频 AI' },
  { key: 'code', label: '开发 AI' },
  { key: 'research', label: '论文 AI' },
] as const

export function CategoryTopSection({ tools }: CategoryTopSectionProps) {
  const [active, setActive] = useState<typeof CATEGORIES[number]['key']>('image')

  // 对每个分类,按 views*0.6 + rating*40 排序取前 10
  const getTop10 = (cat: string) => {
    return tools
      .filter((t) => t.category === cat)
      .map((t) => ({ ...t, score: (t.views || 0) * 0.6 + (t.rating || 0) * 40 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }

  const currentTools = getTop10(active)

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
              <Trophy className="size-4 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">7 赛道 TOP 10</h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              各赛道最佳
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            按"浏览量×0.6 + 评分×40"加权排序,每日更新
          </p>
        </div>
        <Link
          href="/rankings"
          className="hidden items-center gap-0.5 text-xs font-medium text-brand-purple transition-colors hover:text-brand-deep sm:flex"
        >
          完整排行榜
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 7 个 tab */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-brand-purple/[0.04] p-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActive(cat.key)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200',
              active === cat.key
                ? 'bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 当前分类 TOP 10 */}
      {currentTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentTools.slice(0, 8).map((tool, i) => (
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
              <ModelCard tool={tool} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
          该赛道暂无工具
        </div>
      )}
    </section>
  )
}
