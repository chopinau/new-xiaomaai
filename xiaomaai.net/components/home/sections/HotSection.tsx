'use client'

import Link from 'next/link'
import { Flame, ChevronRight } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { ModelCard } from '@/components/ModelCard'

interface HotSectionProps {
  tools: Tool[]
}

export function HotSection({ tools }: HotSectionProps) {
  // 按 views 排序取前 8
  const hot = [...tools]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8)

  if (hot.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="size-4 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">热门 AI</h2>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              按浏览量排序
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            用户浏览量 Top 8,每款都经过市场验证
          </p>
        </div>
        <Link
          href="/tools?sort=hot"
          className="hidden items-center gap-0.5 text-xs font-medium text-brand-purple transition-colors hover:text-brand-deep sm:flex"
        >
          查看全部
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {hot.map((tool, i) => (
          <ModelCard key={tool.id} tool={tool} index={i} />
        ))}
      </div>
    </section>
  )
}
