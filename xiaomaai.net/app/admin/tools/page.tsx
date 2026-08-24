'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Check,
  Trash2,
  ExternalLink,
  Lock,
  RefreshCw,
  Loader2,
  Inbox,
  Tag,
  Boxes,
  Search,
  Filter,
  CheckSquare,
  Square,
  Database,
  Upload,
  FileText,
  Pencil,
  XCircle,
  ChevronDown,
  Download,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { tools, type Tool } from '@/data/tools'
import UploadProductForm from '@/components/admin/UploadProductForm'
import SopHintCard from '@/components/admin/SopHintCard'
import FetchLogPanel, { type FetchPayload } from '@/components/admin/FetchLogPanel'

type ToolDraft = {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: {
    slug: string
    name: string
    description: string
    url: string
    logoUrl?: string
    category: string
    tags: string[]
    pricing: string
    rating?: number
    views?: number
    createdAt?: string
    updatedAt?: string
  }
}

type ActiveTab = 'drafts' | 'published' | 'upload'

const CATEGORY_OPTIONS = [
  { key: 'chat', label: 'AI 对话' },
  { key: 'image', label: 'AI 图像' },
  { key: 'video', label: 'AI 视频' },
  { key: 'audio', label: 'AI 音频' },
  { key: 'code', label: 'AI 编程' },
  { key: 'productivity', label: 'AI 效率' },
]

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  'github-trending': { label: 'GitHub', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  producthunt: { label: 'Product Hunt', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  submit: { label: '用户提交', className: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' },
  faxianai: { label: '发现AI', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  toolify: { label: 'Toolify.ai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  aitaaft: { label: "There's An AI For That", className: 'bg-violet-50 text-violet-700 border-violet-200' },
  futurepedia: { label: 'Futurepedia', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  aibase: { label: 'AIbase', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  'ai-bot': { label: 'AI工具集', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  'ai-nav': { label: 'AI导航', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
}

const PRICING_LABELS: Record<string, string> = {
  free: '免费',
  freemium: '免费增值',
  paid: '付费',
  enterprise: '企业',
}

const AUTH_KEY = 'xiaoma_admin_password'

const GITHUB_EDIT_URL = 'https://github.com/chopinau/xiaoma-AI-net/edit/main/xiaomaai.net/data/tools.ts'

export default function AdminToolsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [drafts, setDrafts] = useState<ToolDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busySlugs, setBusySlugs] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [overrides, setOverrides] = useState<Record<string, { category: string; tags: string }>>({})
  const [activeTab, setActiveTab] = useState<ActiveTab>('drafts')

  // 已入库 tab 状态
  const [publishedSearch, setPublishedSearch] = useState('')
  const [publishedSelected, setPublishedSelected] = useState<Set<string>>(new Set())
  const [batchCategory, setBatchCategory] = useState('')
  const [batchTags, setBatchTags] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)

  // 一键抓取状态
  const [fetchTriggerKey, setFetchTriggerKey] = useState(0)
  const [fetchPayload, setFetchPayload] = useState<FetchPayload | null>(null)
  const [showFetchLog, setShowFetchLog] = useState(false)
  const [fetchSource, setFetchSource] = useState('')

  const loadDrafts = useCallback(async (pwd: string, opts?: { source?: string; search?: string }) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ password: pwd })
      if (opts?.source) params.set('source', opts.source)
      if (opts?.search) params.set('search', opts.search)
      const res = await fetch(`/api/admin/tools?${params.toString()}`)
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

  useEffect(() => {
    if (authed) loadDrafts(password, { source: sourceFilter, search })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter, search, authed])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/tools?password=${encodeURIComponent(password)}`)
    if (res.status === 401) {
      setError('密码错误')
      return
    }
    localStorage.setItem(AUTH_KEY, password)
    setAuthed(true)
    loadDrafts(password, { source: sourceFilter, search })
  }

  // 一键抓取:触发 FetchLogPanel 启动新抓取
  const handleFetch = (source: string) => {
    setFetchSource(source)
    setFetchPayload({ type: 'tools', source, password })
    setFetchTriggerKey((k) => k + 1)
    setShowFetchLog(true)
  }

  const buildOverridesBody = (slugs: string[]) => {
    const cats = new Set<string>()
    const tagLists: string[][] = []
    let allSameCategory = true
    let allSameTags = true
    for (const s of slugs) {
      const ov = overrides[s]
      const draft = drafts.find((d) => d.tool?.slug === s)
      if (!draft) continue
      cats.add(ov?.category || draft.tool.category)
      tagLists.push(ov?.tags ? ov.tags.split(/[,，]/).map((x) => x.trim()).filter(Boolean) : (draft.tool.tags || []))
    }
    if (cats.size !== 1) allSameCategory = false
    const tagKey = JSON.stringify(tagLists[0] || [])
    for (const t of tagLists) if (JSON.stringify(t) !== tagKey) { allSameTags = false; break }
    return {
      category: allSameCategory ? Array.from(cats)[0] : undefined,
      tags: allSameTags ? tagLists[0] : undefined,
    }
  }

  const handleSingleAction = async (slug: string, action: 'publish' | 'discard') => {
    setBusySlugs((prev) => new Set(prev).add(slug))
    setNotice('')
    setError('')
    try {
      const ov = overrides[slug]
      const res = await fetch('/api/admin/tools/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          action,
          password,
          category: ov?.category,
          tags: ov?.tags ? ov.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || '操作失败')
      } else {
        setDrafts((prev) => prev.filter((d) => d.tool?.slug !== slug))
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(slug)
          return next
        })
        setNotice(action === 'publish' ? '已入库到 data/tools.ts' : '已丢弃草稿')
        setTimeout(() => setNotice(''), 2500)
      }
    } catch {
      setError('网络错误')
    }
    setBusySlugs((prev) => {
      const next = new Set(prev)
      next.delete(slug)
      return next
    })
  }

  const handleBatchAction = async (action: 'publish' | 'discard') => {
    if (selected.size === 0) return
    const slugs = Array.from(selected)
    setBusySlugs(new Set(slugs))
    setNotice('')
    setError('')
    try {
      const ov = buildOverridesBody(slugs)
      const res = await fetch('/api/admin/tools/batch-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs, action, password, ...ov }),
      })
      const json = await res.json()
      if (!json.success && json.successCount === 0) {
        setError(json.error || '批量操作失败')
      } else {
        const successSlugs = new Set((json.results || []).filter((r: any) => r.ok).map((r: any) => r.slug))
        setDrafts((prev) => prev.filter((d) => !successSlugs.has(d.tool?.slug)))
        setSelected(new Set())
        setNotice(`${action === 'publish' ? '入库' : '丢弃'} ${json.successCount} 条${json.failCount ? `,失败 ${json.failCount} 条` : ''}`)
        setTimeout(() => setNotice(''), 3000)
      }
    } catch {
      setError('网络错误')
    }
    setBusySlugs(new Set())
  }

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === drafts.length && drafts.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(drafts.map((d) => d.tool?.slug).filter(Boolean) as string[]))
    }
  }

  const allSelected = drafts.length > 0 && selected.size === drafts.length
  const someSelected = selected.size > 0 && selected.size < drafts.length

  const sources = useMemo(() => {
    const set = new Set(drafts.map((d) => d.source).filter(Boolean))
    return Array.from(set)
  }, [drafts])

  // 已入库 tab: 过滤
  const filteredTools = useMemo(() => {
    const q = publishedSearch.trim().toLowerCase()
    if (!q) return tools
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    )
  }, [publishedSearch])

  const togglePublishedSelect = (id: string) => {
    setPublishedSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePublishedSelectAll = () => {
    if (publishedSelected.size === filteredTools.length && filteredTools.length > 0) {
      setPublishedSelected(new Set())
    } else {
      setPublishedSelected(new Set(filteredTools.map((t) => t.id)))
    }
  }

  const allPublishedSelected = filteredTools.length > 0 && publishedSelected.size === filteredTools.length
  const somePublishedSelected = publishedSelected.size > 0 && publishedSelected.size < filteredTools.length

  const handlePublishedBatch = async (action: 'category' | 'tags' | 'offline') => {
    if (publishedSelected.size === 0) return
    setBatchLoading(true)
    try {
      const body: Record<string, unknown> = {
        ids: Array.from(publishedSelected),
        action,
        password,
      }
      if (action === 'category') {
        if (!batchCategory) {
          toast({ title: '请选择分类', variant: 'destructive' })
          setBatchLoading(false)
          return
        }
        body.category = batchCategory
      }
      if (action === 'tags') {
        const tags = batchTags.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
        if (tags.length === 0) {
          toast({ title: '请输入标签', variant: 'destructive' })
          setBatchLoading(false)
          return
        }
        body.tags = tags
      }
      const res = await fetch('/api/admin/tools/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      toast({
        title: json.message || '操作完成',
        variant: json.success === false ? 'destructive' : 'default',
      })
    } catch {
      toast({ title: '网络错误', variant: 'destructive' })
    }
    setBatchLoading(false)
  }

  const categoryLabel = (key: string): string => {
    const found = CATEGORY_OPTIONS.find((c) => c.key === key)
    return found ? found.label : key
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm border-border p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-hero">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">工具草稿后台</h1>
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

  const tabs: Array<{ key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'drafts', label: '草稿', icon: FileText },
    { key: 'published', label: '已入库', icon: Database },
    { key: 'upload', label: '上传新产品', icon: Upload },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-gradient text-sm font-bold text-white">
              小
            </div>
            <span className="text-base font-semibold">工具草稿后台</span>
            <Badge variant="outline" className="ml-2 hidden border-border text-muted-foreground sm:inline-flex">
              半自动 · 人工审核入库
            </Badge>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/admin"><ArrowLeft className="mr-1 h-4 w-4" />返回管理后台</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* SopHintCard */}
        <div className="mb-6">
          <SopHintCard />
        </div>

        {/* 一键抓取按钮组 */}
        <div className="mb-6 rounded-xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/[0.06] via-card to-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-purple" />
              <span className="text-sm font-semibold text-foreground">一键抓取</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                抓取后进入草稿区,需人工审核入库
              </span>
            </div>

            {/* 分裂式按钮:主按钮(faxianai) + 下拉选择其他源 */}
            <div className="ml-auto flex items-stretch overflow-hidden rounded-md border border-brand-purple/40 shadow-sm">
              <Button
                size="sm"
                onClick={() => handleFetch('faxianai')}
                disabled={fetchSource !== ''}
                className="rounded-r-none border-r-0 bg-brand-gradient text-white hover:brightness-110 disabled:opacity-60"
              >
                {fetchSource === 'faxianai' ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1 h-3.5 w-3.5" />
                )}
                抓取 faxianai
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={fetchSource !== ''}
                    className="rounded-l-none border-l border-brand-purple/40 bg-brand-gradient px-2 text-white hover:brightness-110 disabled:opacity-60"
                    aria-label="选择其他抓取源"
                  >
                    {fetchSource !== '' && fetchSource !== 'faxianai' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem
                    onClick={() => handleFetch('toolify')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 Toolify.ai
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFetch('aitaaft')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 There&rsquo;s An AI For That
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFetch('futurepedia')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 Futurepedia
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFetch('aibase')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 AIbase
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFetch('ai-bot')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 AI工具集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFetch('ai-nav')}
                    disabled={fetchSource !== ''}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> 抓取 AI导航
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleFetch('all')}
                    disabled={fetchSource !== ''}
                  >
                    <Zap className="mr-2 h-3.5 w-3.5 text-brand-purple" /> 全部抓取
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 抓取日志面板 */}
        {showFetchLog && fetchPayload && (
          <div className="mb-6">
            <FetchLogPanel
              payload={fetchPayload}
              triggerKey={fetchTriggerKey}
              onComplete={() => {
                loadDrafts(password, { source: sourceFilter, search })
                setTimeout(() => {
                  setShowFetchLog(false)
                  setFetchSource('')
                }, 3000)
              }}
              onClose={() => {
                setShowFetchLog(false)
                setFetchSource('')
              }}
            />
          </div>
        )}

        {/* Tab 切换 */}
        <div className="mb-6 flex items-center gap-6 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`group relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-brand-purple' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-brand-purple" />
                )}
              </button>
            )
          })}
        </div>

        {/* 草稿 tab */}
        {activeTab === 'drafts' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-purple" />
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
                  <option key={s} value={s}>{SOURCE_LABELS[s]?.label || s}</option>
                ))}
              </select>

              <div className="relative ml-auto flex-1 min-w-[180px] sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索名称/描述/slug..."
                  className="h-8 border-border bg-background pl-8 text-xs"
                />
              </div>
            </div>

            {/* 批量操作栏 */}
            {selected.size > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-brand-purple/30 bg-brand-purple/[0.04] p-3">
                <span className="text-sm font-medium text-brand-purple">
                  已选 {selected.size} 个
                </span>
                <span className="text-xs text-muted-foreground">
                  (批量入库时,仅在所有选中项的分类/标签相同时才应用覆盖)
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('publish')}
                    disabled={busySlugs.size > 0}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />批量入库
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchAction('discard')}
                    disabled={busySlugs.size > 0}
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
                  草稿由 GitHub Actions 每周抓取自动写入，请等待定时任务或手动运行{' '}
                  <code className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">scripts/fetch-trending.mjs</code>
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

                {drafts.map((draft) => {
                  const src = SOURCE_LABELS[draft.source] || SOURCE_LABELS.submit
                  const ov = overrides[draft.tool.slug]
                  const isSelected = selected.has(draft.tool.slug)
                  const isBusy = busySlugs.has(draft.tool.slug)
                  return (
                    <Card
                      key={draft.tool.slug}
                      className={`card-brand p-5 transition-colors ${isSelected ? 'border-brand-purple/50 bg-brand-purple/[0.03]' : 'border-border'}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 复选框 */}
                        <button
                          onClick={() => toggleSelect(draft.tool.slug)}
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
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            {/* 左侧: 工具信息 */}
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-start gap-3">
                                {draft.tool.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={draft.tool.logoUrl}
                                    alt=""
                                    className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted object-cover"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-bold text-brand-purple">
                                    {(draft.tool.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold leading-snug">{draft.tool.name}</h3>
                                    <Badge variant="outline" className={src.className}>{src.label}</Badge>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{draft.tool.description}</p>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <a
                                  href={draft.tool.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-brand-purple hover:underline"
                                >
                                  官网 <ExternalLink className="h-3 w-3" />
                                </a>
                                {draft.tool.tags.length > 0 && (
                                  <span className="inline-flex flex-wrap items-center gap-1">
                                    {draft.tool.tags.slice(0, 4).map((tag) => (
                                      <Badge key={tag} variant="outline" className="border-border text-[10px]">{tag}</Badge>
                                    ))}
                                  </span>
                                )}
                                <span>{draft.sourceUrl?.replace('https://', '')?.slice(0, 40)}</span>
                              </div>

                              {/* 入库覆盖项 */}
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                  <select
                                    value={ov?.category ?? draft.tool.category}
                                    onChange={(e) =>
                                      setOverrides((prev) => ({
                                        ...prev,
                                        [draft.tool.slug]: { ...prev[draft.tool.slug], category: e.target.value },
                                      }))
                                    }
                                    className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-brand-purple"
                                  >
                                    {CATEGORY_OPTIONS.map((c) => (
                                      <option key={c.key} value={c.key}>{c.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                                  <Input
                                    defaultValue={draft.tool.tags.join(', ')}
                                    placeholder="自定义标签,逗号分隔"
                                    onChange={(e) =>
                                      setOverrides((prev) => ({
                                        ...prev,
                                        [draft.tool.slug]: { ...prev[draft.tool.slug], tags: e.target.value },
                                      }))
                                    }
                                    className="h-8 w-56 border-border bg-card text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 右侧: 操作 */}
                            <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end">
                              <Button
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleSingleAction(draft.tool.slug, 'publish')}
                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                              >
                                {isBusy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                                入库
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => handleSingleAction(draft.tool.slug, 'discard')}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />丢弃
                                </Button>
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                  <a href={draft.sourceUrl || draft.tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />来源
                                  </a>
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

            <Card className="mt-8 border-border bg-muted/30 p-5 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">💡 使用说明</p>
              <p>· 草稿由 <code className="rounded bg-muted px-1">.github/workflows/weekly-trending-draft.yml</code> 每周一 03:00（北京）自动抓取 GitHub + Product Hunt。</p>
              <p>· 顶部支持「按来源筛选 + 关键词搜索 + 全选/批量入库/丢弃」。</p>
              <p>· 「入库」前可修改分类 / 标签，随后写入 <code className="rounded bg-muted px-1">data/tools.ts</code> 并从草稿区移除。</p>
              <p>· 「丢弃」仅删除该草稿。批量入库时,仅在所有选中项的分类/标签相同时才应用覆盖。</p>
              <p className="mt-1">· 抓取仅取仓库 description，入库后建议人工润色描述与标签。</p>
            </Card>
          </div>
        )}

        {/* 已入库 tab */}
        {activeTab === 'published' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-brand-purple" />
                <h2 className="text-lg font-bold">已入库工具 <span className="text-muted-foreground">({tools.length})</span></h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={publishedSearch}
                  onChange={(e) => setPublishedSearch(e.target.value)}
                  placeholder="按名称/描述搜索..."
                  className="h-9 border-border bg-background pl-8 text-sm"
                />
              </div>
            </div>

            {/* 批量操作工具栏 */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
              <span className="text-sm font-medium text-foreground">
                批量操作 {publishedSelected.size > 0 && <span className="text-brand-purple">（已选 {publishedSelected.size} 个）</span>}
              </span>

              <div className="ml-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-brand-purple"
                  >
                    <option value="">选择分类</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={publishedSelected.size === 0 || batchLoading}
                    onClick={() => handlePublishedBatch('category')}
                    className="text-xs"
                  >
                    {batchLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    批量改分类
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={batchTags}
                    onChange={(e) => setBatchTags(e.target.value)}
                    placeholder="标签,逗号分隔"
                    className="h-8 w-40 border-border bg-background text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={publishedSelected.size === 0 || batchLoading}
                    onClick={() => handlePublishedBatch('tags')}
                    className="text-xs"
                  >
                    批量加标签
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={publishedSelected.size === 0 || batchLoading}
                  onClick={() => handlePublishedBatch('offline')}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />批量下架
                </Button>
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                      <th className="w-10 px-3 py-2.5">
                        <button
                          onClick={togglePublishedSelectAll}
                          className="text-muted-foreground transition-colors hover:text-brand-purple"
                          type="button"
                          aria-label={allPublishedSelected ? '取消全选' : '全选'}
                        >
                          {allPublishedSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand-purple" />
                          ) : somePublishedSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand-purple/60" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2.5">工具</th>
                      <th className="px-3 py-2.5">分类</th>
                      <th className="px-3 py-2.5">标签</th>
                      <th className="px-3 py-2.5">定价</th>
                      <th className="px-3 py-2.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                          没有匹配的工具
                        </td>
                      </tr>
                    ) : (
                      filteredTools.map((tool: Tool) => {
                        const isSelected = publishedSelected.has(tool.id)
                        return (
                          <tr
                            key={tool.id}
                            className={`border-b border-border last:border-b-0 transition-colors hover:bg-muted/30 ${
                              isSelected ? 'bg-brand-purple/[0.03]' : ''
                            }`}
                          >
                            <td className="px-3 py-2.5 align-top">
                              <button
                                onClick={() => togglePublishedSelect(tool.id)}
                                className="text-muted-foreground transition-colors hover:text-brand-purple"
                                type="button"
                                aria-label={isSelected ? '取消选择' : '选择'}
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-brand-purple" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                {tool.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={tool.logoUrl}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-md border border-border bg-muted object-cover"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-purple/10 text-xs font-bold text-brand-purple">
                                    {tool.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground">{tool.name}</span>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-brand-purple"
                                      aria-label="访问官网"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{tool.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <Badge variant="outline" className="border-border text-xs">
                                {categoryLabel(tool.category)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div className="flex flex-wrap gap-1">
                                {tool.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="border-border text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                                {tool.tags.length > 3 && (
                                  <Badge variant="outline" className="border-border text-[10px]">
                                    +{tool.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top text-xs text-foreground">
                              {PRICING_LABELS[tool.pricing] || tool.pricing}
                            </td>
                            <td className="px-3 py-2.5 align-top text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <a
                                  href={GITHUB_EDIT_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  编辑
                                </a>
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 上传新产品 tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              📝 手动上传新产品，提交后进入草稿区，审核通过后入库到 data/tools.ts
            </div>
            <UploadProductForm />
          </div>
        )}
      </div>
    </div>
  )
}
