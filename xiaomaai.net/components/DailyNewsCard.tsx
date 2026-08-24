'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { NewsItem } from '@/data/news'

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  llm: { label: '大模型', className: 'bg-brand-purple/10 text-brand-purple' },
  opensource: { label: '开源', className: 'bg-green-500/10 text-green-600' },
  business: { label: '商业', className: 'bg-brand-blue/10 text-brand-blue' },
  funding: { label: '融资', className: 'bg-brand-pink/10 text-brand-pink' },
}

export function DailyNewsCard({ item }: { item: NewsItem }) {
  const cat = CATEGORY_CONFIG[item.category] || { label: item.category, className: 'bg-muted text-muted-foreground' }

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card shadow-card transition-all hover:border-brand-purple/30 hover:shadow-card-hover">
      <Link href={`/news/${item.id}`} className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.className}`}>
            {cat.label}
          </span>
          <span className="text-[11px] text-muted-foreground">{item.date}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{item.source}</span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-brand-purple transition-colors">
          {item.title}
        </h3>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
      </Link>

      <div className="px-5 pb-5">
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-purple hover:text-brand-deep transition-colors"
        >
          阅读原文
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  )
}