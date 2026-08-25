'use client'

export const runtime = 'edge';

import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import {

  Calendar, Clock, Eye, Tag, ChevronRight, Sparkles,
  ListOrdered, Library, Flame, PenLine,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import ShareButton from '@/components/ShareButton'
import type { Article } from '@/data/articles'
import type { Tool } from '@/data/tools'
import { collections, type Collection } from '@/data/collections'

const CATEGORY_LABELS: Record<Article['category'], string> = {
  tutorial: '教程',
  review: '评测',
  news: '资讯',
  guide: '指南',
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN')
}

/**
 * 逐行渲染正文（沿用原 whitespace-pre-wrap 纯文本方式）。
 * 当某行是 markdown 标题且与 toc 条目匹配时，在该行前插入对应 id 的锚点，
 * 供右侧目录点击跳转（scroll-mt-24 避开 sticky 顶栏）。
 */
function renderContent(content: string, toc?: Article['toc']) {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m && toc && toc.length) {
      const entry = toc.find(t => m[2].includes(t.text))
      if (entry) {
        return (
          <Fragment key={i}>
            <span id={entry.id} aria-hidden className="block h-0 scroll-mt-24" />
            {line}
            {i < lines.length - 1 ? '\n' : ''}
          </Fragment>
        )
      }
    }
    return <Fragment key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</Fragment>
  })
}

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [relatedTools, setRelatedTools] = useState<Tool[]>([])
  const [activeTocId, setActiveTocId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    Promise.all([
      fetch('/api/articles?limit=50').then(r => r.json()),
      fetch('/api/tools?limit=500').then(r => r.json()),
    ]).then(([articlesRes, toolsRes]) => {
      const arts = (articlesRes.data || []) as Article[]
      const ts = (toolsRes.data || []) as Tool[]
      const a = arts.find((x: Article) => x.slug === slug)
      if (!a) {
        notFound()
        return
      }
      setArticle(a)
      setAllArticles(arts)
      setAllTools(ts)
      setRelatedTools(ts.filter((t: Tool) => a.relatedToolSlugs?.includes(t.slug)).slice(0, 4))
      setLoading(false)
    }).catch(() => notFound())
  }, [slug])

  // TOC 滚动高亮：观察各锚点是否进入视口顶部区域
  useEffect(() => {
    if (!article?.toc?.length) return
    const headings = article.toc
      .map(t => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el)
    if (!headings.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveTocId(entry.target.id)
        })
      },
      { rootMargin: '-88px 0px -65% 0px', threshold: 0 },
    )
    headings.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [article])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p>加载中...</p>
      </div>
    )
  }

  if (!article) return null

  // 热门专题：优先 relatedCollectionSlugs，其次补充其他合集，取 4 个
  const relatedCollections: Collection[] = (() => {
    const bySlug = new Map(collections.map(c => [c.slug, c]))
    const picked: Collection[] = []
    article.relatedCollectionSlugs?.forEach(s => {
      const c = bySlug.get(s)
      if (c && !picked.includes(c)) picked.push(c)
    })
    for (const c of collections) {
      if (picked.length >= 4) break
      if (!picked.includes(c)) picked.push(c)
    }
    return picked.slice(0, 4)
  })()

  // 热门工具排行：按浏览量降序取 5
  const hotTools = [...allTools]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)

  // 相关文章：同分类、排除自身、取 3（与 data/articles.ts 中 getRelatedArticles 逻辑一致）
  const relatedArticles = allArticles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 3)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />

      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑：首页 > 资讯教程 > 文章分类 > 文章标题 */}
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="transition hover:text-brand-purple">首页</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/articles" className="transition hover:text-brand-purple">资讯教程</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/articles?category=${article.category}`} className="transition hover:text-brand-purple">
            {CATEGORY_LABELS[article.category]}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="max-w-[240px] truncate font-medium text-foreground">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* 左侧正文区 */}
          <div className="lg:col-span-8">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
              {/* 分类标签 */}
              <Link
                href={`/articles?category=${article.category}`}
                className="mb-3 inline-flex items-center rounded-full gradient-brand px-3 py-1 text-[11px] font-medium text-white"
              >
                {CATEGORY_LABELS[article.category]}
              </Link>

              <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
                {article.title}
              </h1>

              {/* 文章信息：发布时间 / 更新时间 / 作者 / 浏览量 */}
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  发布于 {formatDate(article.publishedAt)}
                </span>
                {article.updatedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    更新于 {formatDate(article.updatedAt)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {article.views} 次浏览
                </span>
                <span className="flex items-center gap-1.5">
                  <PenLine className="h-3.5 w-3.5" />
                  作者：{article.author}
                </span>
              </div>

              {/* 封面图 */}
              {article.coverUrl && (
                <div className="mb-6 overflow-hidden rounded-xl border border-border">
                  <img
                    src={article.coverUrl}
                    alt={article.title}
                    className="w-full"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                  />
                </div>
              )}

              {/* 加粗展示摘要 */}
              <p className="mb-6 rounded-xl border border-brand-purple/10 bg-gradient-to-r from-brand-purple/5 via-brand-blue/5 to-brand-purple/5 p-4 text-sm font-semibold leading-relaxed text-foreground">
                {article.excerpt}
              </p>

              {/* 正文 */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {renderContent(article.content, article.toc)}
              </div>

              {/* 标签 */}
              {article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {article.tags.map(tag => (
                    <span key={tag} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 文中提到的工具（横排） */}
              {relatedTools.length > 0 && (
                <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-brand-purple" />
                    文中提到的工具
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {relatedTools.map(tool => (
                      <Link key={tool.id} href={`/tools/${tool.slug}`} className="group w-56 shrink-0">
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition group-hover:border-brand-purple/40 group-hover:shadow-card">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-brand text-sm font-bold text-white">
                            {tool.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{tool.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 分享 */}
              <div className="mt-8 flex items-center justify-center border-t border-border pt-6">
                <ShareButton url={pageUrl} title={article.title} description={article.excerpt} />
              </div>
            </article>

            {/* 文末相关文章推荐 */}
            {relatedArticles.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                  <PenLine className="h-4 w-4 text-brand-purple" />
                  相关文章
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {relatedArticles.map(a => (
                    <Link
                      key={a.id}
                      href={`/articles/${a.slug}`}
                      className="group flex flex-col rounded-xl border border-border bg-white p-4 transition hover:border-brand-purple/40 hover:shadow-card"
                    >
                      {a.coverUrl && (
                        <div className="mb-3 h-24 overflow-hidden rounded-lg border border-border">
                          <img
                            src={a.coverUrl}
                            alt={a.title}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      )}
                      <span className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {CATEGORY_LABELS[a.category]}
                      </span>
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition group-hover:text-brand-purple">
                        {a.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧边栏（lg 以上显示，sticky） */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 space-y-5">
              {/* 文章目录 TOC */}
              {article.toc && article.toc.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <ListOrdered className="h-4 w-4 text-brand-purple" />
                    文章目录
                  </h2>
                  <nav className="space-y-1 border-l border-border">
                    {article.toc.map(t => (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        className={`block border-l-2 py-1 pl-3 text-sm leading-relaxed transition ${
                          activeTocId === t.id
                            ? 'border-brand-purple font-medium text-brand-purple'
                            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                        } ${t.level > 2 ? 'pl-6' : ''}`}
                      >
                        {t.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* 热门专题推荐 */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Library className="h-4 w-4 text-brand-purple" />
                  热门专题
                </h2>
                <div className="space-y-2">
                  {relatedCollections.map(c => (
                    <Link
                      key={c.slug}
                      href={`/collections/${c.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition hover:border-brand-purple/40 hover:shadow-card"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-brand text-xs font-bold text-white">
                        {c.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground transition group-hover:text-brand-purple">
                          {c.title}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{c.toolSlugs.length} 个工具</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* 热门工具排行 */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  热门工具排行
                </h2>
                <div className="space-y-1">
                  {hotTools.map((t, i) => (
                    <Link
                      key={t.id}
                      href={`/tools/${t.slug}`}
                      className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted"
                    >
                      <span className={`w-5 shrink-0 text-center text-xs font-bold ${i < 3 ? 'text-brand-purple' : 'text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-foreground transition group-hover:text-brand-purple">
                        {t.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {(t.views || 0).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
