'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import type { Article } from '@/data/articles'

// 302.ai 风格：分类只有纯文字 + 计数
const CATEGORIES = [
  { key: 'all',      label: '全部' },
  { key: 'tutorial', label: '教程' },
  { key: 'review',   label: '评测' },
  { key: 'news',     label: '资讯' },
  { key: 'guide',    label: '指南' },
] as const

const PAGE_SIZE = 12

export default function ArticlesListPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/articles?limit=50')
      .then(r => r.json())
      .then(res => {
        setArticles(res.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[Articles] fetch failed:', err)
        setLoading(false)
      })
  }, [])

  // SEO: 动态设置 title 和 meta description
  useEffect(() => {
    document.title = '资讯教程中心 - 小马 AI'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'AI 行业动态 · 深度教程 · 工具评测 - 小马 AI 资讯教程中心')
  }, [])

  // 初始化分类：从 URL 读取（支持从文章页的分类链接进入）
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('category')
    if (c && CATEGORIES.some(cat => cat.key === c)) {
      setCategory(c)
    }
  }, [])

  // 切换分类 / 搜索时重置页码
  useEffect(() => {
    setPage(1)
  }, [category, query])

  const filtered = articles.filter(a => {
    if (category !== 'all' && a.category !== category) return false
    if (query) {
      const q = query.toLowerCase()
      return a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleCategory(key: string) {
    setCategory(key)
    router.replace(key === 'all' ? '/articles' : `/articles?category=${key}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            资讯教程中心
          </h1>
          <p className="text-base text-muted-foreground">AI 行业动态 · 深度教程 · 工具评测</p>
        </div>

        {/* 搜索 */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索教程、评测、资讯..."
            className="h-10 border-border bg-white pl-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-brand-purple focus-visible:ring-0"
          />
        </div>

        {/* 分类 - 302.ai 风格：下划线激活态 */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all' ? articles.length : articles.filter(a => a.category === cat.key).length
            return (
              <button
                key={cat.key}
                onClick={() => handleCategory(cat.key)}
                className={`relative -mb-px px-3 py-2 text-sm transition ${
                  category === cat.key
                    ? 'font-medium text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-purple'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`ml-1.5 text-[10px] ${category === cat.key ? 'text-brand-purple' : 'text-muted-foreground'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-md border border-border bg-white" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="rounded-md border border-border bg-white p-12 text-center">
            <p className="text-muted-foreground">没有匹配的文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paged.map(article => (
              <Link key={article.id} href={`/articles/${article.slug}`}>
                <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-purple/40 hover:shadow-card-hover">
                  {article.coverUrl && (
                    <div className="relative h-40 overflow-hidden border-b border-border bg-white">
                      <img
                        src={article.coverUrl}
                        alt={article.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {article.category === 'tutorial' ? '教程' :
                        article.category === 'review' ? '评测' :
                          article.category === 'news' ? '资讯' : '指南'}
                    </span>
                    <h3 className="mb-1.5 line-clamp-2 text-base font-bold leading-tight text-foreground">{article.title}</h3>
                    <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
            ))}
          </div>
        )}

        {/* 分页：每页 12 条，上一页 / 下一页 */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand-purple/40 hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </button>
            <span className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand-purple/40 hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
