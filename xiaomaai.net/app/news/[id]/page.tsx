'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {

export const runtime = 'edge';
  Calendar,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Tag,
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

  const cat = CATEGORY_CONFIG[item.category] || {
    label: item.category,
    className: 'bg-muted text-muted-foreground',
  }

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

  // Dynamic SEO: title, meta description
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

  // JSON-LD structured data: NewsArticle
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary.slice(0, 150),
    datePublished: item.date,
    author: {
      '@type': 'Organization',
      name: item.source,
    },
    publisher: {
      '@type': 'Organization',
      name: '小马 AI',
      url: 'https://xiaomaai.net',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
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

      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* 面包屑导航 */}
        <div className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/news" className="transition-colors hover:text-foreground">
            AI 每日快讯
          </Link>
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

        {/* 文章主体 */}
        <article className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          {/* 元信息 */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cat.className}`}
            >
              <Tag className="mr-1 inline-block size-3" />
              {cat.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {formatDate(item.date)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              来源：{item.source}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {item.title}
          </h1>

          {/* 正文内容 */}
          <div className="mb-8 rounded-lg bg-muted/50 p-5">
            <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {item.summary}
            </p>
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
            <span className="text-xs text-muted-foreground">
              {item.source}
            </span>
          </div>
        </article>

        {/* 相关工具 */}
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="size-5 text-brand-purple" />
            相关 AI 工具
          </h2>

          {loadingTools ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-shimmer rounded-xl border border-border bg-card"
                />
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
                    <p className="truncate text-sm font-semibold text-foreground">
                      {tool.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无相关工具推荐
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
