'use client'

import { useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { tools, getCategories } from '@/data/tools'
import { SearchBar } from '@/components/tools/SearchBar'
import { CategorySidebar } from '@/components/tools/CategorySidebar'
import { BigHotGrid } from '@/components/tools/BigHotGrid'
import { Top10Tabs } from '@/components/tools/Top10Tabs'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'

const CATEGORY_ANCHORS = [
  { id: 'cat-hot', label: '大热门 AI' },
  { id: 'cat-top10', label: 'TOP 10' },
] as const

type CategoryAnchorId = (typeof CATEGORY_ANCHORS)[number]['id']

export default function ToolsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const catParam = searchParams.get('cat') ?? 'cat-hot'

  // 防御：只接受白名单内的锚点
  const isValidAnchor = (id: string): id is CategoryAnchorId =>
    CATEGORY_ANCHORS.some((c) => c.id === id)
  const currentCat: string = isValidAnchor(catParam) ? catParam : 'cat-hot'

  // 统计每个类目（data category）下的工具数，传给左侧 CategorySidebar
  const catCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const t of tools) {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    }
    return counts
  }, [])

  // 调用 getCategories() 以确保 tree-shaking 不会丢弃该函数（typing 占位）
  const _categories = useMemo(() => getCategories(), [])

  const handleSelect = (catId: string): void => {
    router.replace(`/tools?cat=${catId}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />

      {/* 顶部 sticky 搜索条 */}
      <div className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 py-2">
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 移动端：sidebar 折叠为顶部下拉 */}
        <details className="mb-4 rounded-xl border border-border bg-white p-2 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-900">
            <span>切换工具分类</span>
            <ChevronDown className="h-4 w-4 text-ink-500" />
          </summary>
          <div className="mt-2 border-t border-border pt-2">
            <CategorySidebar
              currentCat={currentCat}
              onSelect={handleSelect}
              catCounts={catCounts}
            />
          </div>
        </details>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 左：分类侧边栏 (3/12) */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-20">
              <CategorySidebar
                currentCat={currentCat}
                onSelect={handleSelect}
                catCounts={catCounts}
              />
            </div>
          </aside>

          {/* 右：主区 (9/12) */}
          <main className="space-y-8 lg:col-span-9">
            <section id="cat-hot" className="scroll-mt-24">
              <BigHotGrid tools={tools} />
            </section>
            <section id="cat-top10" className="scroll-mt-24">
              <Top10Tabs tools={tools} />
            </section>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}