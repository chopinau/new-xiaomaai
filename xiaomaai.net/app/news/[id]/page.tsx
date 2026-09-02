'use client'

export const runtime = 'edge';

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Tag,
  Clock,
  Eye,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { TopMarquee } from '@/components/TopMarquee'
import { SiteFooter } from '@/components/site-footer'
import { newsItems } from '@/data/news'
import type { NewsItem } from '@/data/news'
import type { Tool } from '@/data/tools'

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  llm: { label: '大模型', className: 'bg-brand-purple/10 text-brand-purple' },
  opensource: { label: '开源', className: 'bg-green-500/10 text-green-600' },
  business: { label: '商业', className: 'bg-brand-blue/10 text-brand-blue' },
  funding: { label: '融资', className: 'bg-brand-pink/10 text-brand-pink' },
}

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  llm: '大模型 AI LLM',
  opensource: '开源 开源模型',
  business: '商业 企业',
  funding: '融资 投资',
}

// 热门标签（来自 Cocoloop 风格）
const HOT_TAGS = [
  { name: 'OpenAI', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { name: 'AI Agent', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { name: 'Anthropic', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { name: 'AI编程', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { name: 'AI安全', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { name: 'Claude', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { name: '开源', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
  { name: '企业AI', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { name: '融资', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { name: '大模型', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { name: 'Google', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { name: 'AI监管', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
  { name: 'AI基础设施', color: 'bg-lime-50 text-lime-700 hover:bg-lime-100' },
  { name: 'AI芯片', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
  { name: 'Gemini', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { name: '机器人', color: 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100' },
  { name: '英伟达', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { name: 'ChatGPT', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
]

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const item = newsItems.find((n) => n.id === id)

  if (!item) {
    notFound()
  }

  return <NewsDetailContent item={item} />
}

function NewsDetailContent({ item }: { item: NewsItem }) {
  const [relatedTools, setRelatedTools] = useState<Tool[]>([])
  const [loadingTools, setLoadingTools] = useState(true)
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])

  const cat = CATEGORY_CONFIG[item.category] || {
    label: item.category,
    className: 'bg-muted text-muted-foreground',
  }

  // 获取上下篇
  const currentIndex = newsItems.findIndex((n) => n.id === item.id)
  const prevItem = currentIndex > 0 ? newsItems[currentIndex - 1] : null
  const nextItem = currentIndex < newsItems.length - 1 ? newsItems[currentIndex + 1] : null

  // Fetch related tools
  useEffect(() => {
    const searchTerm = CATEGORY_SEARCH_TERMS[item.category] || item.category
    fetch(`/api/tools?q=${encodeURIComponent(searchTerm)}&limit=10`)
      .then((r) => r.json())
      .then((res) => {
        setRelatedTools((res.data || []).slice(0, 4))
      })
      .catch(() => {
        setRelatedTools([])
      })
      .finally(() => setLoadingTools(false))
  }, [item.category])

  // 获取最新文章（侧边栏）
  useEffect(() => {
    const otherNews = newsItems
      .filter((n) => n.id !== item.id)
      .slice(0, 8)
    setLatestNews(otherNews)
  }, [item.id])

  // Dynamic SEO
  useEffect(() => {
    document.title = `${item.title} - AI 快讯 | 小马AI`
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', item.summary.slice(0, 150))
  }, [item])

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary.slice(0, 150),
    datePublished: item.date,
    author: { '@type': 'Organization', name: item.source },
    publisher: { '@type': 'Organization', name: '小马 AI', url: 'https://xiaomaai.net' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekDay = weekDays[d.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopMarquee />
      <TopNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* 面包屑 */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">首页</Link>
          <ChevronRight className="size-3" />
          <Link href="/news" className="transition-colors hover:text-foreground">AI 每日快讯</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate">{item.title}</span>
        </div>

        {/* 返回链接 */}
        <Link
          href="/news"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-purple transition-colors hover:text-brand-deep"
        >
          <ArrowLeft className="size-4" />
          返回快讯列表
        </Link>

        {/* 两栏布局 */}
        <div className="flex gap-8 items-start">
          {/* 主内容区 */}
          <article className="flex-1 min-w-0">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
              {/* 元信息 */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cat.className}`}>
                  <Tag className="mr-1 inline-block size-3" />
                  {cat.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {formatDate(item.date)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {item.source}
                </span>
              </div>

              {/* 标题 */}
              <h1 className="mb-6 text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
                {item.title}
              </h1>

              {/* 正文内容 */}
              {item.content ? (
                <div
                  className="news-content mb-8"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                <div className="mb-8 rounded-lg bg-muted/50 p-5">
                  <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                    {item.summary}
                  </p>
                </div>
              )}

              {/* 参考来源 */}
              <div className="mb-6 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">参考来源：</span>
                {item.source} 官方页面、CocoLoop 编辑整理
              </div>

              {/* 来源链接 */}
              <div className="flex items-center gap-2 border-t border-border pt-5">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple transition-colors hover:text-brand-deep"
                >
                  阅读原文
                  <ExternalLink className="size-3.5" />
                </Link>
                <span className="text-xs text-muted-foreground">{item.source}</span>
              </div>
            </div>

            {/* 上下篇导航 */}
            {(prevItem || nextItem) && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {prevItem ? (
                  <Link
                    href={`/news/${prevItem.id}`}
                    className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-brand-purple/30 hover:shadow-md"
                  >
                    <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-purple" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">上一篇</p>
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-brand-purple">
                        {prevItem.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">上一篇</p>
                    <p className="text-sm text-muted-foreground/50">没有更多了</p>
                  </div>
                )}
                {nextItem ? (
                  <Link
                    href={`/news/${nextItem.id}`}
                    className="group flex items-center justify-end gap-2 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-brand-purple/30 hover:shadow-md"
                  >
                    <div className="min-w-0 text-right">
                      <p className="text-xs text-muted-foreground">下一篇</p>
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-brand-purple">
                        {nextItem.title}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-purple" />
                  </Link>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground text-right">下一篇</p>
                    <p className="text-sm text-muted-foreground/50 text-right">没有更多了</p>
                  </div>
                )}
              </div>
            )}

            {/* 相关工具 */}
            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Sparkles className="size-5 text-brand-purple" />
                相关 AI 工具
              </h2>
              {loadingTools ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 animate-shimmer rounded-xl border border-border bg-card" />
                  ))}
                </div>
              ) : relatedTools.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card card-brand transition-colors hover:border-brand-purple/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-bold text-brand-purple">
                        {tool.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">暂无相关工具推荐</p>
              )}
            </section>
          </article>

          {/* 右侧边栏 */}
          <aside className="hidden lg:block w-80 shrink-0 space-y-6">
            {/* 最新文章 */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="inline-block h-4 w-1 rounded-full bg-brand-purple" />
                最新文章
              </h3>
              <div className="space-y-3">
                {latestNews.map((news, idx) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.id}`}
                    className="group flex gap-3 transition-colors"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-relaxed text-foreground transition-colors group-hover:text-brand-purple">
                        {news.title}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{news.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 热门标签 */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="inline-block h-4 w-1 rounded-full bg-brand-purple" />
                热门标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {HOT_TAGS.map((tag) => (
                  <Link
                    key={tag.name}
                    href={`/news?q=${encodeURIComponent(tag.name)}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tag.color}`}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 关于小马AI */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="inline-block h-4 w-1 rounded-full bg-brand-purple" />
                关于小马AI
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                AI工具、教程、资讯一站式中文社区。每天为你精选全球最新 AI 动态。
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-lg bg-brand-purple px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-deep"
              >
                访问主站
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
