'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Tool } from '@/data/tools'

interface RankingCardProps {
  tool: Tool
  rank: number
  rankChange: 'up' | 'down' | 'same'
  index?: number
}

function getRankStyles(rank: number): {
  bg: string
  text: string
  gradient: string
} {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
        text: 'text-yellow-500',
        gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      }
    case 2:
      return {
        bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
        text: 'text-gray-400',
        gradient: 'from-gray-300 via-slate-300 to-gray-400',
      }
    case 3:
      return {
        bg: 'bg-gradient-to-br from-amber-600 to-amber-700',
        text: 'text-amber-600',
        gradient: 'from-amber-500 via-orange-400 to-amber-600',
      }
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        gradient: '',
      }
  }
}

export function RankingCard({ tool, rank, rankChange, index = 0 }: RankingCardProps) {
  const router = useRouter()
  const rankStyle = getRankStyles(rank)

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        onClick={() => router.push(`/tools/${tool.slug}`)}
        className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      >
        {/* 排名数字 */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-extrabold text-white ${
              rank <= 3 ? rankStyle.bg : 'bg-muted text-muted-foreground'
            }`}
          >
            {rank}
          </div>
          {/* 排名变化趋势 */}
          <div className="flex items-center">
            {rankChange === 'up' && (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {rankChange === 'down' && (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            {rankChange === 'same' && (
              <Minus className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
          </div>
        </div>

        {/* 工具 Logo / 首字母 */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
          {tool.logoUrl ? (
            <img
              src={tool.logoUrl}
              alt={tool.name}
              className="h-7 w-7 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  const span = document.createElement('span')
                  span.className = 'text-sm font-bold text-brand-purple'
                  span.textContent = tool.name.charAt(0)
                  parent.appendChild(span)
                }
              }}
            />
          ) : (
            <span className="text-sm font-bold text-brand-purple">
              {tool.name.charAt(0)}
            </span>
          )}
        </div>

        {/* 工具信息 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-card-foreground transition-colors group-hover:text-brand-purple">
              {tool.name}
            </h3>
            {tool.category && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-medium text-brand-purple">
                {tool.category}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {tool.description}
          </p>
        </div>

        {/* 数据指标 */}
        <div className="flex shrink-0 items-center gap-4 text-right">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">
              {(tool.views ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">浏览</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-brand-purple">
              {rank <= 10 ? '🔥' : rank <= 30 ? '⭐' : '📈'}
            </span>
            <span className="text-[10px] text-muted-foreground">热度</span>
          </div>
          <span className="hidden text-xs font-medium text-brand-purple transition-colors group-hover:text-brand-blue sm:inline">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  )
}