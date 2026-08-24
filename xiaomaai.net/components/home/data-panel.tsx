'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight, TrendingUp, Cpu, Layers } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { articles } from '@/data/articles'
import { cn } from '@/lib/utils'

interface DataPanelProps {
  stats: {
    toolCount: number
    articleCount: number
    modelCount: number
  }
  allTools: Tool[]
}

const categoryLabelMap: Record<string, string> = {
  chat: 'AI 对话',
  image: 'AI 图像',
  video: 'AI 视频',
  audio: 'AI 音频',
  code: 'AI 编程',
  productivity: 'AI 效率',
}

export function DataPanel({ stats, allTools }: DataPanelProps) {
  const categoryRanking = useMemo(() => {
    const counts: Record<string, number> = {}
    allTools.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([key, count]) => ({ key, name: categoryLabelMap[key] || key, count }))
      .sort((a, b) => b.count - a.count)
  }, [allTools])

  const topArticles = articles.slice(0, 3)
  const maxCount = categoryRanking[0]?.count || 1

  const metrics = [
    { label: '收录工具', value: stats.toolCount.toString(), suffix: '个', icon: Layers, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: '教程文章', value: stats.articleCount.toString(), suffix: '篇', icon: BookOpen, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: '模型定价', value: stats.modelCount.toString(), suffix: '个', icon: Cpu, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
  ]

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
            <TrendingUp className="size-4 text-brand" />
          </div>
          数据概览
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-brand/5 p-3 transition-transform hover:-translate-y-0.5">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', m.bg)}>
                <m.icon className={cn('size-4', m.color)} />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {m.value}
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">{m.suffix}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-pink/10">
            <Cpu className="size-4 text-brand-pink" />
          </div>
          分类排行
        </h3>
        <div className="flex flex-col gap-3">
          {categoryRanking.map((cat, i) => {
            const percent = Math.round((cat.count / maxCount) * 100)
            return (
              <div key={cat.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded text-[10px] font-bold',
                        i < 3 ? 'gradient-brand text-white' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {i + 1}
                    </span>
                    {cat.name}
                  </span>
                  <span className="text-muted-foreground">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full gradient-brand transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-brand" />
            精选教程
          </h3>
          <Link href="/articles" className="flex items-center gap-0.5 text-xs text-brand transition hover:text-brand-deep">
            全部
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {topArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <BookOpen className="size-4 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-brand">
                  {article.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{article.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
