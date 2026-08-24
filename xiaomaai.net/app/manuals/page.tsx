'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Search, Eye, Calendar, ChevronRight, X } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { manuals, manualCategories } from '@/data/manuals'
import { cn } from '@/lib/utils'

export default function ManualsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')

  const filtered = useMemo(() => {
    let result = manuals
    if (activeCategory !== '全部') {
      result = result.filter((m) => m.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.excerpt.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [search, activeCategory])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-8 shadow-card sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <BookOpen className="size-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              AI 操作手册
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {manuals.length}+ 篇精选 AI 工具实战教程 · 每个产品配 5 个真实案例 + 进阶玩法 + 提示词合集
            </p>

            <div className="relative mt-6 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索手册名称、标签…"
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-purple/40 focus:ring-2 focus:ring-brand-purple/15"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 分类筛选 */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {manualCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                activeCategory === cat
                  ? 'border-brand-purple bg-brand-purple text-white shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-brand-purple/40 hover:text-brand-purple'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 结果统计 */}
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {search || activeCategory !== '全部' ? '筛选' : '全部'}结果：{filtered.length} 篇
          </span>
        </div>

        {/* 卡片网格 */}
        {filtered.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((manual) => (
              <Link
                key={manual.slug}
                href={`/manuals/${manual.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover"
              >
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="size-10 text-emerald-600/40 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 backdrop-blur-sm">
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
                  <div className="mt-3 flex flex-wrap gap-1">
                    {manual.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
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
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <BookOpen className="size-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">未找到匹配的手册</h3>
            <p className="mt-1 text-sm text-muted-foreground">尝试调整搜索关键词或切换分类</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
