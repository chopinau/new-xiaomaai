'use client'

import Link from 'next/link'
import { Newspaper, ChevronRight } from 'lucide-react'
import { getRecentNews } from '@/data/news'
import type { NewsItem } from '@/data/news'

const CATEGORY_LABELS: Record<string, string> = {
  llm: '大模型',
  opensource: '开源',
  business: '商业',
  funding: '融资',
}

export function NewsBar() {
  const list = getRecentNews(6)

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-purple/10">
          <Newspaper className="size-4 text-brand-purple" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI 每日快讯</h3>
        <Link
          href="/news"
          className="ml-auto flex items-center gap-0.5 text-xs font-medium text-brand-purple hover:text-brand-deep transition-colors"
        >
          查看全部
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="scrollbar-none flex snap-x gap-4 overflow-x-auto p-4">
        {list.map((item) => (
          <div
            key={item.id}
            className="group w-64 shrink-0 snap-start rounded-xl border border-border bg-background p-4 transition-all hover:border-brand-purple/30 hover:bg-card hover:shadow-card"
          >
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] text-brand-purple">
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <span>{item.date}</span>
            </div>
            <h4 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand-purple transition-colors">
              {item.title}
            </h4>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <span>{item.source}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}