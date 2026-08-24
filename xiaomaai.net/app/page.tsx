'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Library, ChevronRight } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { TopMarquee } from '@/components/TopMarquee'
import { SiteFooter } from '@/components/site-footer'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { CategorySidebar } from '@/components/home/category-sidebar'
import { QuickLinks } from '@/components/home/quick-links'
import { BentoFeatured } from '@/components/home/bento-featured'
import { ToolGrid } from '@/components/home/tool-grid'
import { DataPanel } from '@/components/home/data-panel'
import { NewsBar } from '@/components/home/news-bar'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { FavoritesRecent } from '@/components/home/favorites-recent'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'
import { BigHotSection } from '@/components/home/sections/BigHotSection'
import { HotSection } from '@/components/home/sections/HotSection'
import { CategoryTopSection } from '@/components/home/sections/CategoryTopSection'
import { ManualsSection } from '@/components/home/sections/ManualsSection'
import { AgentsSection } from '@/components/home/sections/AgentsSection'
import { tools as allTools } from '@/data/tools'
import type { Tool } from '@/data/tools'
import type { Collection } from '@/data/collections'
import { articles } from '@/data/articles'
import { modelPricing } from '@/data/modelPricing'

const TABS = [
  { key: 'all', label: '全部', sort: (a: Tool, b: Tool) => (b.rating || 0) - (a.rating || 0) },
  { key: 'hot', label: '热门', sort: (a: Tool, b: Tool) => (b.views || 0) - (a.views || 0) },
  { key: 'featured', label: '精选', sort: (a: Tool, b: Tool) => Number(b.featured || 0) - Number(a.featured || 0) },
] as const

const PAGE_SIZE = 16

export default function MarketHome() {
  const [tools, setTools] = useState<Tool[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/tools?limit=500').then((r) => r.json()),
      fetch('/api/collections').then((r) => r.json()),
    ])
      .then(([toolsRes, collectionsRes]) => {
        setTools(toolsRes.data || [])
        setCollections(collectionsRes.data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = tools
    if (category !== 'all') {
      result = result.filter((t) => t.category === category)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }
    const tab = TABS.find((t) => t.key === activeTab)
    if (tab) {
      result = [...result].sort(tab.sort)
    }
    return result
  }, [tools, category, query, activeTab])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [category, query, activeTab])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTools.length }
    allTools.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return counts
  }, [])

  const stats = useMemo(() => {
    return {
      toolCount: allTools.length,
      articleCount: articles.length,
      modelCount: Object.keys(modelPricing).length,
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopMarquee />
      <TopNav query={query} setQuery={setQuery} />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_320px]">
          <CategorySidebar category={category} setCategory={setCategory} counts={categoryCounts} />

          <div className="flex min-w-0 flex-col gap-8">
            <HeroCarousel />
            <QuickLinks />
            <FavoritesRecent allTools={allTools} />

            {/* faxianai.com 5 分区 - 仅在默认视图显示 */}
            {category === 'all' && !query.trim() && !loading && (
              <>
                <BigHotSection tools={tools} />
                <HotSection tools={tools} />
                <CategoryTopSection tools={tools} />
                <ManualsSection />
                <AgentsSection />

                {/* 热门专题 */}
                {collections.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue">
                            <Library className="size-4 text-white" />
                          </div>
                          <h2 className="text-xl font-bold tracking-tight text-foreground">热门专题</h2>
                          <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold text-brand-purple">
                            精选合集
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          一份合集打包同场景 AI 工具，按专题质量持续精选
                        </p>
                      </div>
                      <Link
                        href="/collections"
                        className="hidden items-center gap-0.5 text-xs font-medium text-brand-purple transition-colors hover:text-brand-deep sm:flex"
                      >
                        全部专题
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {collections.slice(0, 6).map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/collections/${collection.slug}`}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover"
                        >
                          {/* 封面：有 coverImage 用封面图，否则渐变占位 */}
                          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-purple/15 via-brand-blue/10 to-brand-pink/15">
                            {collection.coverImage ? (
                              <img
                                src={collection.coverImage}
                                alt={collection.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Library className="size-10 text-brand-purple/40 transition-transform duration-500 group-hover:scale-110" />
                              </div>
                            )}
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-purple backdrop-blur-sm">
                              {collection.category}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-4">
                            <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-purple">
                              {collection.title}
                            </h3>
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                              {collection.description}
                            </p>
                            <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground/70">
                              <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-medium text-brand-purple">
                                {collection.toolSlugs.length} 个工具
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {category === 'all' && !query.trim() && !loading && <BentoFeatured tools={tools} />}
            <div className="flex items-center justify-end">
              <SubmitToolDialog variant="outline" size="sm" className="border-brand-purple/50 text-brand-purple hover:bg-brand-purple/5 hover:border-brand-purple" />
            </div>
            <ToolGrid
              tools={tools}
              filtered={filtered}
              loading={loading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              query={query}
              setQuery={setQuery}
              visibleCount={visibleCount}
              setVisibleCount={setVisibleCount}
              PAGE_SIZE={PAGE_SIZE}
            />
          </div>

          <div className="xl:sticky xl:top-[84px] xl:h-fit">
            <DataPanel stats={stats} allTools={allTools} />
          </div>
        </div>

        <div className="mt-10">
          <NewsletterSignup />
        </div>

        <div className="mt-10">
          <NewsBar />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
