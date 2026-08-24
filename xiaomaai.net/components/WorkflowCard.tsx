'use client'

import Link from 'next/link'
import { Workflow, Sparkles } from 'lucide-react'
import type { WorkflowMeta } from '@/data/workflows'

// 价格 → 徽章样式
const PRICE_STYLES: { match: string; className: string }[] = [
  { match: '免费', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { match: '¥9.9', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  { match: '¥19.9', className: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' },
  { match: '¥29.9', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  { match: '¥39.9', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  { match: '¥49.9', className: 'bg-rose-50 text-rose-700 border-rose-200' },
]

function priceBadgeClass(price: string) {
  const found = PRICE_STYLES.find((p) => price.includes(p.match))
  return found ? found.className : 'bg-muted text-muted-foreground border-border'
}

interface WorkflowCardProps {
  workflow: WorkflowMeta
  index?: number
}

export function WorkflowCard({ workflow, index = 0 }: WorkflowCardProps) {
  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link
        href={`/workflows/${workflow.slug}`}
        className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      >
        {/* 图标 + 分类标签 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 transition-transform duration-300 group-hover:scale-110">
            <Workflow className="h-5 w-5 text-brand-purple" />
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-purple">
            {workflow.category}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-card-foreground transition-colors group-hover:text-brand-purple">
          {workflow.name}
        </h3>

        {/* 描述 */}
        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
          {workflow.description}
        </p>

        {/* 价格 + 标签 */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priceBadgeClass(workflow.price)}`}>
            {workflow.price}
          </span>
          {workflow.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 使用模板按钮 */}
        <div className="mt-auto border-t border-border pt-2.5">
          <span className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-brand-purple/20 bg-brand-purple/5 text-xs font-medium text-brand-purple transition-all group-hover:border-brand-purple group-hover:bg-brand-purple/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>查看模板</span>
          </span>
        </div>
      </Link>
    </div>
  )
}
