'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Newspaper,
  Check,
  Trash2,
  ExternalLink,
  Lock,
  RefreshCw,
  Loader2,
  Clock,
  Inbox,
  Search,
  Filter,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import FetchLogPanel, { type FetchPayload } from '@/components/admin/FetchLogPanel'

type NewsDraft = {
  id: string
  title: string
  source: string
  url: string
  summary: string
  content: string
  coverImage?: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

const CATEGORY_LABELS: Record<string, { label: string; className: string }> = {
  llm: { label: '大模型', className: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' },
  opensource: { label: '开源', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  business: { label: '商业', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  funding: { label: '融资', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const AUTH_KEY = 'xiaoma_admin_password'

export default function AdminNewsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [drafts, setDrafts] = useState<NewsDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [fetchTriggerKey, setFetchTriggerKey] = useState(0)
  const [fetchPayload, setFetchPayload] = useState<FetchPayload | null>(null)
  const [showFetchLog, setShowFetchLog] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const pageSize = 20

  const loadDrafts = useCallback(async (pwd: string, opts?: { source?: string; search?: string }) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ password: pwd })
      if (opts?.source) params.set('source', opts.source)
      if (opts?.search) params.set('search', opts.search)
      const res = await fetch(`/api/admin/news?${params.toString()}`)
      if (res.status === 401) {
        localStorage.removeItem(AUTH_KEY)
        setAuthed(false)
        setLoading(false)
        return
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '加载失败')
      setDrafts(json.data || [])
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY)
    if (saved) {
      setPassword(saved)
      setAuthed(true)
      loadDrafts(saved, { source: sourceFilter, search })
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 筛选/搜索变化时重新加载并重置页码
  useEffect(() => {
    setPage(1)
    if (authed) loadDrafts(password, { source: sourceFilter, search })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter, search, authed])

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(drafts.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageDrafts = drafts.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/news?password=${encodeURIComponent(password)}`)
    if (res.status === 401) {
      setError('密码错误')
      return
    }
    localStorage.setItem(AUTH_KEY, password)
    setAuthed(true)
    loadDrafts(password, { source: sourceFilter, search })
  }

  const handleSingleAction = async (id: string, action: 'publish' | 'discard') => {
    setBusyIds((prev) => new Set(prev).add(id))
    setNotice('')
    setError('')
    try {
      const res = await fetch('/api/admin/news/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, password }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || '操作失败')
      } else {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setNotice(action === 'publish' ? '已发布到 data/news.ts' : '已丢弃草稿')
        setTimeout(() => setNotice(''), 2500)
      }
    } catch {
      setError('网络错误')
    }
    setBusyIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleBatchAction = async (action: 'publish' | 'discard') => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setBusyIds(new Set(ids))
    setNotice('')
    setError('')
    try {
      const res = await fetch('/api/admin/news/batch-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, password }),
      })
      const json = await res.json()
      if (!json.success && json.successCount === 0) {
        setError(json.error || '批量操作失败')
      } else {
        // 从 UI 移除成功的 ID
        const successIds = new Set((json.results || []).filter((r: any) => r.ok).map((r: any) => r.id))
        setDrafts((prev) => prev.filter((d) => !successIds.has(d.id)))
        setSelected(new Set())
        setNotice(`${action === 'publish' ? '发布' : '丢弃'} ${json.successCount} 条${json.failCount ? `,失败 ${json.failCount} 条` : ''}`)
        setTimeout(() => setNotice(''), 3000)
      }
    } catch {
      setError('网络错误')
    }
    setBusyIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === drafts.length && drafts.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(drafts.map((d) => d.id)))
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFetchNews = () => {
    setFetching(true)
    setFetchPayload({ type: 'news', password: 'admin123' })
    setFetchTriggerKey((k) => k + 1)
    setShowFetchLog(true)
  }

  const allSelected = drafts.length > 0 && selected.size === drafts.length
  const someSelected = selected.size > 0 && selected.size < drafts.length

  const sources = useMemo(() => {
    const set = new Set(drafts.map((d) => d.source).filter(Boolean))
    return Array.from(set)
  }, [drafts])

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm border-border p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-hero">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">资讯草稿后台</h1>
            <p className="mt-1 text-sm text-muted-foreground">请输入管理员密码（ADMIN_PASSWORD）</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理员密码"
              className="h-11 border-border bg-card"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full gradient-brand text-white hover:brightness-110">
              解锁后台
            </Button>
          </form>
          <Link href="/admin" className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> 返回管理后台
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-gradient text-sm font-bold text-white">
              小
            </div>
            <span className="text-base font-semibold">资讯草稿后台</span>
            <Badge variant="outline" className="ml-2 hidden border-border text-muted-foreground sm:inline-flex">
              半自动 · 人工审核发布
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/admin"><ArrowLeft className="mr-1 h-4 w-4" />返回管理后台</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 一键抓取区 */}
        <div className="mb-6">
          <Button
            onClick={handleFetchNews}
            disabled={fetching}
            className="w-full rounded-xl bg-brand-gradient text-white shadow-hero hover:brightness-110 disabled:opacity-60"
            size="lg"
          >
            {fetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                抓取中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                抓取最新资讯
              </>
            )}
          </Button>

          {showFetchLog && fetchPayload && (
            <div className="mt-3">
              <FetchLogPanel
                payload={fetchPayload}
                triggerKey={fetchTriggerKey}
                onComplete={() => {
                  loadDrafts(password, { source: sourceFilter, search })
                  setTimeout(() => {
                    setShowFetchLog(false)
                    setFetching(false)
                  }, 3000)
                }}
                onClose={() => {
                  setShowFetchLog(false)
                  setFetching(false)
                }}
              />
            </div>
          )}
        </div>

        {/* 工具条 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-brand-purple" />
            <h2 className="text-lg font-bold">待审核草稿 <span className="text-muted-foreground">({drafts.length})</span></h2>
          </div>
          <div className="flex items-center gap-2">
            {notice && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{notice}</Badge>}
            {error && <Badge className="border-red-200 bg-red-50 text-red-700">{error}</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDrafts(password, { source: sourceFilter, search })}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />刷新
            </Button>
          </div>
        </div>

        {/* 筛选 + 搜索栏 */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>来源</span>
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-brand-purple"
          >
            <option value="">全部</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="relative ml-auto flex-1 min-w-[180px] sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或摘要..."
              className="h-8 border-border bg-background pl-8 text-xs"
            />
          </div>
        </div>

        {/* 批量操作栏(选中后显示) */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-brand-purple/30 bg-brand-purple/[0.04] p-3">
            <span className="text-sm font-medium text-brand-purple">
              已选 {selected.size} 条
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBatchAction('publish')}
                disabled={busyIds.size > 0}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Check className="mr-1 h-3.5 w-3.5" />批量发布
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchAction('discard')}
                disabled={busyIds.size > 0}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />批量丢弃
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
                className="text-muted-foreground"
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-brand-purple" />
            <p className="text-sm text-muted-foreground">加载草稿…</p>
          </div>
        ) : drafts.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50 p-12 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">暂无草稿</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              草稿由 GitHub Actions 每日抓取自动写入，请等待定时任务或手动运行{' '}
              <code className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">scripts/fetch-news.mjs</code>
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* 全选行 */}
            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                type="button"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-brand-purple" />
                ) : someSelected ? (
                  <CheckSquare className="h-4 w-4 text-brand-purple/60" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>{allSelected ? '取消全选' : '全选'}</span>
              </button>
            </div>

            {pageDrafts.map((draft) => {
              const cat = CATEGORY_LABELS[draft.category] || CATEGORY_LABELS.business
              const isSelected = selected.has(draft.id)
              const isBusy = busyIds.has(draft.id)
              return (
                <Card
                  key={draft.id}
                  className={`card-brand p-5 transition-colors ${isSelected ? 'border-brand-purple/50 bg-brand-purple/[0.03]' : 'border-border'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框 */}
                    <button
                      onClick={() => toggleSelect(draft.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-brand-purple"
                      type="button"
                      aria-label={isSelected ? '取消选择' : '选择'}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-brand-purple" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold leading-snug">{draft.title}</h3>
                              <Badge variant="outline" className={cat.className}>{cat.label}</Badge>
                            </div>
                            {draft.coverImage && (
                              <img
                                src={draft.coverImage}
                                alt=""
                                className="mb-2 h-32 w-full rounded object-cover"
                                loading="lazy"
                              />
                            )}
                            <p className="line-clamp-2 text-sm text-muted-foreground">{draft.summary}</p>
                            {/* 全文预览 */}
                            {expandedIds.has(draft.id) && draft.content && (
                              <div
                                className="mt-2 max-h-96 overflow-y-auto rounded border border-border bg-muted/30 p-3 text-xs prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: draft.content }}
                              />
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />{draft.source}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {draft.publishedAt ? new Date(draft.publishedAt).toLocaleDateString('zh-CN') : '-'} 抓取
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleExpand(draft.id)}
                                className="inline-flex items-center gap-1 text-brand-purple hover:underline"
                              >
                                {expandedIds.has(draft.id) ? '收起全文' : '预览全文'}
                              </button>
                              <a
                                href={draft.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-brand-purple hover:underline"
                              >
                                原文 <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleSingleAction(draft.id, 'publish')}
                            className="bg-emerald-500 text-white hover:bg-emerald-600"
                          >
                            {isBusy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                            发布
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleSingleAction(draft.id, 'discard')}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />丢弃
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {drafts.length > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="text-xs"
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {safePage} / {totalPages} 页（共 {drafts.length} 条）
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="text-xs"
            >
              下一页
            </Button>
          </div>
        )}

        {/* 说明 */}
        <Card className="mt-8 border-border bg-muted/30 p-5 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">💡 使用说明</p>
          <p>· 草稿由 <code className="rounded bg-muted px-1">.github/workflows/daily-news-draft.yml</code> 每日 02:00（北京）自动抓取。</p>
          <p>· 顶部支持「按来源筛选 + 关键词搜索 + 全选/批量发布/丢弃」。</p>
          <p>· 「发布」会把草稿移入 <code className="rounded bg-muted px-1">data/news.ts</code>（前台资讯页即时生效），并从草稿区移除。</p>
          <p>· 「丢弃」仅删除该草稿。「编辑」跳转 GitHub 网页编辑器。</p>
          <p className="mt-1">· 密码存储于浏览器 localStorage，请勿在公共电脑上使用。</p>
        </Card>
      </div>
    </div>
  )
}
