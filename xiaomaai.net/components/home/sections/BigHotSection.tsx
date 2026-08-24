'use client'

import Link from 'next/link'
import { Sparkles, ChevronRight, Star } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { ModelCard } from '@/components/ModelCard'

interface BigHotSectionProps {
  tools: Tool[]
}

export function BigHotSection({ tools }: BigHotSectionProps) {
  // 取 featured && rating 最高的 4 个
  const bigHot = tools
    .filter((t) => t.featured)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4)

  if (bigHot.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink">
              <Sparkles className="size-4 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">大热门 AI</h2>
            <span className="rounded-full bg-gradient-to-r from-brand-purple/15 to-brand-pink/15 px-2 py-0.5 text-[10px] font-semibold text-brand-purple">
              编辑精选
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            本周编辑团队精选的 4 款值得立刻体验的 AI 工具
          </p>
        </div>
        <Link
          href="/tools?sort=featured"
          className="hidden items-center gap-0.5 text-xs font-medium text-brand-purple transition-colors hover:text-brand-deep sm:flex"
        >
          查看全部
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bigHot.map((tool, i) => (
          <ModelCard key={tool.id} tool={tool} index={i} large />
        ))}
      </div>
    </section>
  )
}
