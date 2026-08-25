'use client'

import { use, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {

export const runtime = 'edge';
  ChevronRight,
  Archive,
  ListOrdered,
  TrendingUp,
  Newspaper,
  Calendar,
  Eye,
  Star,
  ArrowUpRight,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { getCollectionBySlug } from '@/data/collections'
import type { Collection } from '@/data/collections'
import type { Tool } from '@/data/tools'
import { articles } from '@/data/articles'
import type { Article } from '@/data/articles'

export default function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')

  const collection = getCollectionBySlug(slug)

  useEffect(() => {
    if (!collection) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/tools?limit=500')
      .then((r) => r.json())
      .then((res) => {
        setTools(res.data || [])
        setLoading(false)
      })
      .catch(() => {
        setTools([])
        setLoading(false)
      })
  }, [slug, collection])

  // 分模块：有 sections 用 sections，否则回退为单个模块（兼容旧数据）
  const sections = useMemo(() => {
    if (!collection) return []
    if (collection.sections && collection.sections.length > 0) return collection.sections
    return [
      {
        title: collection.title,
        desc: collection.description,
        toolSlugs: collection.toolSlugs,
      },
    ]
  }, [collection])

  // 工具 slug -> Tool 映射
  const toolBySlug = useMemo(() => {
    const map = new Map<string, Tool>()
    for (const t of tools) map.set(t.slug, t)
    return map
  }, [tools])

  // 每个模块附带已匹配的工具列表
  const sectionsWithTools = useMemo(() => {
    return sections.map((sec, i) => ({
      ...sec,
      id: `section-${i}`,
      items: sec.toolSlugs.map((s) => toolBySlug.get(s)).filter((t): t is Tool => Boolean(t)),
    }))
  }, [sections, toolBySlug])

  // 滚动高亮：监听各模块标题进入视口中间区域
  useEffect(() => {
    if (loading || sections.length === 0) return
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-section-index]'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = entry.target.getAttribute('data-section-index')
            if (idx !== null) setActiveSection(idx)
          }
        }
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loading, sections])

  // 热门工具排行（按 rating 排序取前 5）
  const hotTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 5)
  }, [tools])

  // 热门文章 TOP5（按浏览量）
  const hotArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.views - a.views).slice(0, 5)
  }, [])

  // 相关专题
  const relatedCollections = useMemo(() => {
    if (!collection?.relatedCollectionSlugs?.length) return []
    return collection.relatedCollectionSlugs
      .map((s) => getCollectionBySlug(s))
      .filter((c): c is Collection => Boolean(c))
  }, [collection])

  // 相关文章
  const relatedArticles = useMemo(() => {
    if (!collection?.relatedArticleSlugs?.length) return []
    return collection.relatedArticleSlugs
      .map((s) => articles.find((a) => a.slug === s))
      .filter((a): a is Article => Boolean(a))
  }, [collection])

  if (!collection) {
    notFound()
  }

  const handleTocClick = (index: number) => {
    const el = document.getElementById(`section-${index}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(String(index))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑：首页 > 专题合集 > 当前专题名 */}
        <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">首页</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/collections" className="transition-colors hover:text-foreground">专题合集</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-foreground">{collection.title}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* 主内容 */}
          <div className="min-w-0">
            {/* H1 大标题（唯一）+ 封面 + 引言 */}
            <header className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {collection.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-0.5 text-xs font-medium text-brand-purple">
                  共收录 {collection.toolSlugs.length} 个工具
                </span>
                {collection.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    更新于 {new Date(collection.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
              {collection.coverImage && (
                <img
                  src={collection.coverImage}
                  alt={collection.title}
                  className="mt-5 h-48 w-full rounded-2xl border border-border object-cover sm:h-60"
                />
              )}
              {collection.introContent && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {collection.introContent}
                </p>
              )}
            </header>

            {/* 分模块工具列表 */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : sectionsWithTools.length > 0 ? (
              <div className="space-y-10">
                {sectionsWithTools.map((sec, idx) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    data-section-index={String(idx)}
                    className="scroll-mt-24"
                  >
                    <h2 className="mb-1 flex items-center gap-2.5 text-lg font-bold text-foreground sm:text-xl">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white shadow-sm">
                        {idx + 1}
                      </span>
                      {sec.title}
                    </h2>
                    {sec.desc && (
                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{sec.desc}</p>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {sec.items.map((tool, i) => (
                        <SectionToolCard key={tool.id} tool={tool} index={i} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Archive className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">暂无工具数据</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  该合集暂无可显示的工具，请稍后再来
                </p>
              </div>
            )}

            {/* 总结段落 */}
            {collection.summaryContent && (
              <section className="mt-10 rounded-2xl border border-brand-purple/15 bg-brand-purple/5 p-6">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                  <Archive className="h-4 w-4 text-brand-purple" />
                  总结
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {collection.summaryContent}
                </p>
              </section>
            )}

            {/* 相关推荐：相关专题 + 相关文章 */}
            {(relatedCollections.length > 0 || relatedArticles.length > 0) && (
              <section className="mt-10 border-t border-border pt-8">
                <h2 className="mb-5 text-lg font-bold text-foreground">相关推荐</h2>
                {relatedCollections.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">相关专题</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {relatedCollections.map((c) => (
                        <RelatedCollectionCard key={c.id} collection={c} />
                      ))}
                    </div>
                  </div>
                )}
                {relatedArticles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">相关文章</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {relatedArticles.map((a) => (
                        <RelatedArticleCard key={a.id} article={a} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* 右侧固定侧边栏（桌面端显示，移动端隐藏） */}
          <CollectionSidebar
            sections={sections}
            activeSection={activeSection}
            onTocClick={handleTocClick}
            hotTools={hotTools}
            hotArticles={hotArticles}
          />
        </div>
      </main>

      <div className="pb-16" />

      <SiteFooter />
    </div>
  )
}

/** 模块内工具卡片：复用现有工具卡片样式，点击新窗口打开工具详情页 */
function SectionToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <a
      href={`/tools/${tool.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`查看 ${tool.name} 详情（新窗口打开）`}
      className="group block h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover">
        {/* 顶部装饰光晕 - 悬停时浮现 */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-brand-purple/0 blur-3xl transition-all duration-500 group-hover:bg-brand-purple/15" />

        {/* Logo + 工具名（H3） */}
        <div className="relative mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-purple/8 to-brand-blue/8 ring-1 ring-inset ring-brand-purple/5">
            {tool.logoUrl && !logoFailed ? (
              <img
                src={tool.logoUrl}
                alt={tool.name}
                className="h-6 max-w-[80%] object-contain transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white shadow-sm">
                {tool.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-purple">
            {tool.name}
          </h3>
        </div>

        {/* 1 句推荐语 = 工具描述前 40 字 */}
        <p className="relative flex-1 text-xs leading-relaxed text-ink-500/90">
          {tool.description.slice(0, 40)}
          {tool.description.length > 40 ? '…' : ''}
        </p>

        {/* 评分 + 浏览 */}
        <div className="relative mt-3 flex items-center justify-between border-t border-ink-100 pt-2.5 text-[11px] text-ink-500">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-brand-purple" title="评分">
              <Star className="h-3 w-3 fill-current" />
              {tool.rating ? tool.rating.toFixed(1) : '—'}
            </span>
            <span className="flex items-center gap-0.5" title="浏览量">
              <Eye className="h-3 w-3" />
              {(tool.views ?? 0).toLocaleString()}
            </span>
          </span>
          <span className="flex items-center gap-0.5 font-medium text-brand-purple">
            查看详情
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  )
}

/** 相关专题卡片 */
function RelatedCollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block h-full">
      <div className="flex h-full items-start gap-3 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/30 hover:shadow-card-hover">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
          <Archive className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-purple">
            {collection.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {collection.description}
          </p>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-medium text-brand-purple">
            {collection.toolSlugs.length} 个工具
          </span>
        </div>
      </div>
    </Link>
  )
}

/** 相关文章卡片 */
function RelatedArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block h-full">
      <div className="flex h-full gap-3 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/30 hover:shadow-card-hover">
        {article.coverUrl && (
          <img
            src={article.coverUrl}
            alt={article.title}
            className="h-16 w-24 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-purple">
            {article.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/** 右侧固定侧边栏：本页目录 / 热门工具排行 / 热门文章 TOP5 */
function CollectionSidebar({
  sections,
  activeSection,
  onTocClick,
  hotTools,
  hotArticles,
}: {
  sections: Array<{ title: string }>
  activeSection: string
  onTocClick: (index: number) => void
  hotTools: Tool[]
  hotArticles: Article[]
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-6">
        {/* 本页目录 */}
        {sections.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <ListOrdered className="h-4 w-4 text-brand-purple" />
              本页目录
            </div>
            <nav className="space-y-1">
              {sections.map((sec, i) => {
                const active = activeSection === String(i)
                return (
                  <a
                    key={i}
                    href={`#section-${i}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onTocClick(i)
                    }}
                    aria-current={active ? 'true' : undefined}
                    className={`block truncate rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? 'bg-brand-purple/10 font-medium text-brand-purple'
                        : 'text-muted-foreground hover:bg-ink-50 hover:text-foreground'
                    }`}
                  >
                    {sec.title}
                  </a>
                )
              })}
            </nav>
          </div>
        )}

        {/* 热门工具排行 */}
        {hotTools.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <TrendingUp className="h-4 w-4 text-brand-purple" />
              热门工具排行
            </div>
            <ol className="space-y-3">
              {hotTools.map((tool, i) => (
                <li key={tool.id}>
                  <a
                    href={`/tools/${tool.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${
                        i < 3 ? 'bg-brand-gradient' : 'bg-ink-200 text-ink-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="line-clamp-1 flex-1 text-xs font-medium text-ink-700 transition-colors group-hover:text-brand-purple">
                      {tool.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {(tool.views ?? 0).toLocaleString()}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 热门文章 TOP5 */}
        {hotArticles.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Newspaper className="h-4 w-4 text-brand-purple" />
              热门文章 TOP5
            </div>
            <ol className="space-y-3">
              {hotArticles.map((article, i) => (
                <li key={article.id}>
                  <Link href={`/articles/${article.slug}`} className="group flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${
                        i < 3 ? 'bg-brand-gradient' : 'bg-ink-200 text-ink-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="line-clamp-2 flex-1 text-xs leading-relaxed text-ink-700 transition-colors group-hover:text-brand-purple">
                      {article.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </aside>
  )
}
