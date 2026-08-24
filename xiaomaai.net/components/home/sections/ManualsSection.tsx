'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight, Eye, Calendar } from 'lucide-react'
import { manuals } from '@/data/manuals'

export function ManualsSection() {
  // 取最近更新的 6 篇
  const recent = [...manuals]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <BookOpen className="size-4 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">AI 操作手册</h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              实战教程
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            每个产品配 5 个真实案例 + 进阶玩法 + 提示词合集
          </p>
        </div>
        <Link
          href="/manuals"
          className="hidden items-center gap-0.5 text-xs font-medium text-brand-purple transition-colors hover:text-brand-deep sm:flex"
        >
          全部手册
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((manual) => (
          <Link
            key={manual.slug}
            href={`/manuals/${manual.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover"
          >
            {/* 封面渐变占位 */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-purple/15 via-brand-blue/10 to-brand-pink/15">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="size-10 text-brand-purple/40 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-purple backdrop-blur-sm">
                {manual.category}
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-purple">
                {manual.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                {manual.excerpt}
              </p>
              <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground/70">
                <div className="flex items-center gap-1">
                  <Eye className="size-3" />
                  {(manual.views / 1000).toFixed(1)}k
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {manual.updatedAt}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
