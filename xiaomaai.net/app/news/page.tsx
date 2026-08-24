'use client'

import { useState, useMemo } from 'react'
import { TopNav } from '@/components/TopNav'
import { TopMarquee } from '@/components/TopMarquee'
import { SiteFooter } from '@/components/site-footer'
import { DailyNewsCard } from '@/components/DailyNewsCard'
import { newsItems, NEWS_CATEGORIES, getNewsByDate } from '@/data/news'
import { Newspaper } from 'lucide-react'

export default function NewsPage() {
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    if (category === 'all') return [...newsItems].sort((a, b) => b.date.localeCompare(a.date))
    return newsItems.filter((n) => n.category === category).sort((a, b) => b.date.localeCompare(a.date))
  }, [category])

  const groupedByDate = useMemo(() => {
    const grouped = new Map<string, typeof filtered>()
    for (const item of filtered) {
      const existing = grouped.get(item.date) || []
      existing.push(item)
      grouped.set(item.date, existing)
    }
    return grouped
  }, [filtered])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekDay = weekDays[d.getDay()]
    return `${month}月${day}日 ${weekDay}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopMarquee />
      <TopNav />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
              <Newspaper className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI 每日快讯</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">追踪全球 AI 行业最新动态</p>
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                category === cat.key
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'bg-muted text-muted-foreground hover:bg-brand-purple/10 hover:text-brand-purple'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 快讯列表 - 按日期分组 */}
        <div className="space-y-10">
          {Array.from(groupedByDate.entries()).map(([date, items]) => (
            <section key={date}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">{formatDate(date)}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length} 条
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <DailyNewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Newspaper className="mx-auto size-12 opacity-20" />
            <p className="mt-4 text-sm">暂无该分类的快讯</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}