'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Database, Plus, Edit2, Trash2, Save, X, FileText, Wrench, TrendingUp, Search, ClipboardCheck, Check, XCircle, Clock, Settings, Key, Link as LinkIcon, Bot, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Tool } from '@/data/tools'
import type { Article } from '@/data/articles'

const TOOL_CATEGORIES = [
  { key: 'chat', label: 'AI 对话' },
  { key: 'image', label: 'AI 图像' },
  { key: 'video', label: 'AI 视频' },
  { key: 'audio', label: 'AI 音频' },
  { key: 'code', label: 'AI 编程' },
  { key: 'productivity', label: 'AI 效率' },
]

const PRICING_OPTIONS = [
  { key: 'free', label: '完全免费' },
  { key: 'freemium', label: '免费试用' },
  { key: 'paid', label: '付费订阅' },
  { key: 'enterprise', label: '企业版' },
]

// 分类对应的品牌色
const CATEGORY_COLORS: Record<string, string> = {
  chat: '#7c3aed',
  image: '#06b6d4',
  video: '#d946ef',
  audio: '#f59e0b',
  code: '#10b981',
  productivity: '#6366f1',
}

interface SubmittedTool {
  id: string
  name: string
  description: string
  url: string
  category: string
  tags: string[]
  pricing: string
  submitter: string
  submitterEmail: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

// 环形图组件
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) {
    return <div className="flex h-48 items-center justify-center text-muted-foreground">暂无数据</div>
  }

  let cumulativePercent = 0
  const segments = data.map((d) => {
    const percent = d.value / total
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return { ...d, percent, startPercent }
  })

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const size = 200

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <svg width={size} height={size} viewBox="0 0 200 200" className="shrink-0">
        {/* 背景圆环 */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" className="text-muted" strokeWidth="28" />
        {/* 数据段 */}
        {segments.map((seg, i) => {
          const dashArray = circumference * seg.percent
          const dashOffset = -circumference * seg.startPercent
          return (
            <circle
              key={seg.label}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="28"
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-500"
              style={{ strokeLinecap: 'round' }}
            />
          )
        })}
        {/* 中心文字 */}
        <text x="100" y="95" textAnchor="middle" className="fill-foreground text-[28px] font-bold" dominantBaseline="middle">
          {total}
        </text>
        <text x="100" y="120" textAnchor="middle" className="fill-muted-foreground text-xs" dominantBaseline="middle">
          总计
        </text>
      </svg>
      {/* 图例 */}
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium tabular-nums">{seg.value}</span>
            <span className="text-xs text-muted-foreground">({Math.round(seg.percent * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [submittedTools, setSubmittedTools] = useState<SubmittedTool[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'articles' | 'submissions' | 'settings'>('overview')
  const [editingTool, setEditingTool] = useState<Partial<Tool> | null>(null)
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null)
  const [toolSearch, setToolSearch] = useState('')
  const [llmConfig, setLlmConfig] = useState({ apiUrl: '', apiKey: '', model: 'gpt-4o-mini', hasKey: false, apiKeyMasked: '' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/tools?limit=100').then(r => r.json()),
      fetch('/api/articles?limit=50').then(r => r.json()),
      fetch('/data/submitted-tools.json').then(r => r.json()).catch(() => {
        const stored = localStorage.getItem('xiaoma-submitted-tools')
        return stored ? JSON.parse(stored) : []
      }),
      fetch('/api/admin/settings').then(r => r.json()).catch(() => ({ apiUrl: '', hasKey: false })),
    ]).then(([toolsRes, articlesRes, subRes, settingsRes]) => {
      setTools(toolsRes.data || [])
      setArticles(articlesRes.data || [])
      setSubmittedTools(Array.isArray(subRes) ? subRes : [])
      setLlmConfig(prev => ({ ...prev, ...settingsRes, apiKey: settingsRes.hasKey ? '' : '' }))
      setLoading(false)
    }).catch(err => {
      console.error('[Admin] fetch failed:', err)
      setLoading(false)
    })
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: llmConfig.apiUrl,
          apiKey: llmConfig.apiKey, // 空字符串时后端保留旧 key
          model: llmConfig.model,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        alert('✅ LLM 配置已保存')
        // 重新加载配置
        const settingsRes = await fetch('/api/admin/settings').then(r => r.json())
        setLlmConfig(prev => ({ ...prev, ...settingsRes, apiKey: '' }))
      } else {
        alert('❌ 保存失败: ' + (data.error || '未知错误'))
      }
    } catch (e) {
      alert('❌ 保存失败: ' + e)
    }
    setSavingSettings(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveTool = () => {
    if (!editingTool?.name || !editingTool?.slug) {
      alert('请填写工具名称和 slug')
      return
    }
    if (editingTool.id) {
      setTools(prev => prev.map(t => t.id === editingTool.id ? { ...t, ...editingTool } as Tool : t))
    } else {
      const newTool: Tool = {
        id: editingTool.slug!,
        slug: editingTool.slug!,
        name: editingTool.name!,
        description: editingTool.description || '',
        url: editingTool.url || '#',
        category: editingTool.category || 'chat',
        tags: editingTool.tags || [],
        pricing: editingTool.pricing || 'freemium',
        rating: editingTool.rating || 4.5,
        views: editingTool.views || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTools(prev => [newTool, ...prev])
    }
    setEditingTool(null)
  }

  const handleDeleteTool = (id: string) => {
    if (!confirm('确定删除？')) return
    setTools(prev => prev.filter(t => t.id !== id))
  }

  const handleSaveArticle = () => {
    if (!editingArticle?.title || !editingArticle?.slug) {
      alert('请填写标题和 slug')
      return
    }
    if (editingArticle.id) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...editingArticle } as Article : a))
    } else {
      const newArt: Article = {
        id: String(Date.now()),
        slug: editingArticle.slug!,
        title: editingArticle.title!,
        excerpt: editingArticle.excerpt || '',
        content: editingArticle.content || '',
        category: editingArticle.category || 'news',
        tags: editingArticle.tags || [],
        author: '小马科技',
        relatedToolSlugs: editingArticle.relatedToolSlugs || [],
        publishedAt: new Date().toISOString(),
        views: 0,
      }
      setArticles(prev => [newArt, ...prev])
    }
    setEditingArticle(null)
  }

  const handleDeleteArticle = (id: string) => {
    if (!confirm('确定删除？')) return
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const handleSubmissionStatus = (id: string, status: 'approved' | 'rejected') => {
    const updated = submittedTools.map(s => s.id === id ? { ...s, status } : s)
    setSubmittedTools(updated)
    localStorage.setItem('xiaoma-submitted-tools', JSON.stringify(updated))
  }

  // 过滤工具
  const filteredTools = useMemo(() => {
    if (!toolSearch.trim()) return tools
    const q = toolSearch.toLowerCase()
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  }, [tools, toolSearch])

  // 分类分布数据
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    tools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      label: TOOL_CATEGORIES.find(c => c.key === key)?.label || key,
      value,
      color: CATEGORY_COLORS[key] || '#7c3aed',
    }))
  }, [tools])

  // 最近 7 天提交数
  const recent7DaysSubmissions = useMemo(() => {
    const now = new Date()
    const counts: number[] = []
    const labels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
      counts.push(submittedTools.filter(s => s.submittedAt.split('T')[0] === dateStr).length)
    }
    return { labels, counts }
  }, [submittedTools])

  const pendingSubmissions = submittedTools.filter(s => s.status === 'pending')

  const tabs = [
    { key: 'overview' as const, label: '概览', icon: TrendingUp },
    { key: 'tools' as const, label: `工具 (${tools.length})`, icon: Wrench },
    { key: 'articles' as const, label: `文章 (${articles.length})`, icon: FileText },
    { key: 'submissions' as const, label: `提交审核 (${pendingSubmissions.length})`, icon: ClipboardCheck },
    { key: 'settings' as const, label: '设置', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-brand text-sm font-bold text-white">
              小
            </div>
            <span className="text-base font-semibold">管理后台</span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/"><ArrowLeft className="mr-1 h-4 w-4" />返回市场</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab 切换 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'border-brand-purple bg-brand-purple text-white'
                    : 'border-border bg-card text-muted-foreground hover:border-brand-purple/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">加载中...</p>
        ) : activeTab === 'overview' ? (
          /* 概览 */
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border card-brand p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Wrench className="h-5 w-5 text-brand-purple" />
                  <Badge variant="outline" className="border-brand-purple/30 bg-brand-purple/5 text-brand-purple">活跃</Badge>
                </div>
                <p className="text-3xl font-bold">{tools.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">AI 工具总数</p>
              </Card>
              <Card className="border-border card-brand p-6">
                <div className="mb-2 flex items-center justify-between">
                  <FileText className="h-5 w-5 text-brand-blue" />
                  <Badge variant="outline" className="border-brand-blue/30 bg-brand-blue/5 text-brand-blue">活跃</Badge>
                </div>
                <p className="text-3xl font-bold">{articles.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">文章总数</p>
              </Card>
              <Card className="border-border card-brand p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Database className="h-5 w-5 text-brand-pink" />
                  <Badge variant="outline" className="border-brand-pink/30 bg-brand-pink/5 text-brand-pink">JSON</Badge>
                </div>
                <p className="text-3xl font-bold">{(tools.reduce((sum, t) => sum + (t.views || 0), 0) / 1000).toFixed(1)}k</p>
                <p className="mt-1 text-sm text-muted-foreground">总浏览量</p>
              </Card>
              <Card className="border-border card-brand p-6">
                <div className="mb-2 flex items-center justify-between">
                  <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">待审</Badge>
                </div>
                <p className="text-3xl font-bold">{pendingSubmissions.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">待审核提交</p>
              </Card>
            </div>

            {/* 分类分布 + 最近 7 天提交 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-border p-6">
                <h3 className="mb-4 text-lg font-bold">分类分布</h3>
                <DonutChart data={categoryDistribution} />
              </Card>
              <Card className="border-border p-6">
                <h3 className="mb-4 text-lg font-bold">最近 7 天提交数</h3>
                {recent7DaysSubmissions.counts.every(c => c === 0) ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    近 7 天暂无新提交
                  </div>
                ) : (
                  <div className="flex items-end gap-3 h-48">
                    {recent7DaysSubmissions.labels.map((label, i) => {
                      const maxCount = Math.max(...recent7DaysSubmissions.counts, 1)
                      const height = (recent7DaysSubmissions.counts[i] / maxCount) * 100
                      return (
                        <div key={label} className="flex flex-1 flex-col items-center gap-1">
                          <span className="text-xs font-medium tabular-nums">{recent7DaysSubmissions.counts[i]}</span>
                          <div className="w-full rounded-t-md gradient-brand transition-all duration-500" style={{ height: `${Math.max(height, 4)}%` }} />
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            <Card className="border-border p-6">
              <h3 className="mb-4 text-lg font-bold">数据源</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• 工具数据：<code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">data/tools.ts</code></p>
                <p>• 文章数据：<code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">data/articles.ts</code></p>
                <p>• 提交数据：<code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">data/submitted-tools.json</code></p>
                <p>• 公开 API：<code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">/api/tools</code> · <code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">/api/articles</code></p>
                <p>• 数据来源：<code className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">mahseema/awesome-ai-tools</code>（MIT, 5.1k stars）+ 自研</p>
                <p className="mt-4 text-foreground/70">⚠️ 注：当前为前端演示模式，所有修改仅在浏览器内存中。如需持久化，请改写为 API + JSON 文件存储。</p>
              </div>
            </Card>
          </div>
        ) : activeTab === 'tools' ? (
          /* 工具管理 */
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={toolSearch}
                  onChange={e => setToolSearch(e.target.value)}
                  placeholder="搜索工具名称或 slug..."
                  className="h-10 border-border bg-card pl-9 text-sm focus-visible:ring-brand-purple"
                />
              </div>
              <Button onClick={() => setEditingTool({ category: 'chat', pricing: 'freemium' })} className="gradient-brand text-white hover:brightness-110">
                <Plus className="mr-2 h-4 w-4" />
                新增工具
              </Button>
            </div>

            {editingTool && (
              <Card className="mb-6 border-border p-6">
                <h3 className="mb-4 text-lg font-bold">{editingTool.id ? '编辑工具' : '新增工具'}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">名称 *</label>
                    <Input value={editingTool.name || ''} onChange={e => setEditingTool({ ...editingTool, name: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Slug *</label>
                    <Input value={editingTool.slug || ''} onChange={e => setEditingTool({ ...editingTool, slug: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm text-muted-foreground">描述</label>
                    <Textarea value={editingTool.description || ''} onChange={e => setEditingTool({ ...editingTool, description: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">官网 URL</label>
                    <Input value={editingTool.url || ''} onChange={e => setEditingTool({ ...editingTool, url: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Logo URL</label>
                    <Input value={editingTool.logoUrl || ''} onChange={e => setEditingTool({ ...editingTool, logoUrl: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">分类</label>
                    <select value={editingTool.category} onChange={e => setEditingTool({ ...editingTool, category: e.target.value })} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
                      {TOOL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">价格</label>
                    <select value={editingTool.pricing} onChange={e => setEditingTool({ ...editingTool, pricing: e.target.value as Tool['pricing'] })} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
                      {PRICING_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">标签（逗号分隔）</label>
                    <Input value={editingTool.tags?.join(', ') || ''} onChange={e => setEditingTool({ ...editingTool, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">评分 (0-5)</label>
                    <Input type="number" min="0" max="5" step="0.1" value={editingTool.rating || ''} onChange={e => setEditingTool({ ...editingTool, rating: parseFloat(e.target.value) })} className="border-border bg-card" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingTool(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="mr-1 h-4 w-4" />取消
                  </Button>
                  <Button onClick={handleSaveTool} className="gradient-brand text-white hover:brightness-110">
                    <Save className="mr-1 h-4 w-4" />保存
                  </Button>
                </div>
              </Card>
            )}

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">工具</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">分类</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">价格</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">评分</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">浏览</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map(tool => (
                    <tr key={tool.id} className="border-b border-border hover:bg-brand-purple/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted">
                            <span className="text-xs font-bold">{tool.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">/{tool.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{TOOL_CATEGORIES.find(c => c.key === tool.category)?.label}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-border bg-muted text-muted-foreground">{PRICING_OPTIONS.find(p => p.key === tool.pricing)?.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-amber-500">★ {tool.rating}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tool.views}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditingTool(tool)} className="text-muted-foreground hover:text-brand-purple">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteTool(tool.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTools.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {toolSearch ? '未找到匹配的工具' : '暂无工具数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'articles' ? (
          /* 文章管理 */
          <div>
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setEditingArticle({ category: 'news' })} className="gradient-brand text-white hover:brightness-110">
                <Plus className="mr-2 h-4 w-4" />
                新增文章
              </Button>
            </div>

            {editingArticle && (
              <Card className="mb-6 border-border p-6">
                <h3 className="mb-4 text-lg font-bold">{editingArticle.id ? '编辑文章' : '新增文章'}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">标题 *</label>
                      <Input value={editingArticle.title || ''} onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })} className="border-border bg-card" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Slug *</label>
                      <Input value={editingArticle.slug || ''} onChange={e => setEditingArticle({ ...editingArticle, slug: e.target.value })} className="border-border bg-card" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">摘要</label>
                    <Input value={editingArticle.excerpt || ''} onChange={e => setEditingArticle({ ...editingArticle, excerpt: e.target.value })} className="border-border bg-card" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">分类</label>
                    <select value={editingArticle.category} onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value as Article['category'] })} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
                      <option value="tutorial">教程</option>
                      <option value="review">评测</option>
                      <option value="news">资讯</option>
                      <option value="guide">指南</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">内容 (Markdown)</label>
                    <Textarea value={editingArticle.content || ''} onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })} className="min-h-[300px] border-border bg-card font-mono text-xs" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingArticle(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="mr-1 h-4 w-4" />取消
                  </Button>
                  <Button onClick={handleSaveArticle} className="gradient-brand text-white hover:brightness-110">
                    <Save className="mr-1 h-4 w-4" />保存
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {articles.map(article => (
                <Card key={article.id} className="border-border card-brand p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                          {article.category === 'tutorial' ? '教程' :
                            article.category === 'review' ? '评测' :
                              article.category === 'news' ? '资讯' : '指南'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">/{article.slug}</span>
                      </div>
                      <h3 className="font-bold">{article.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString('zh-CN')} · {article.views} 浏览
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingArticle(article)} className="text-muted-foreground hover:text-brand-purple">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteArticle(article.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : activeTab === 'submissions' ? (
          /* 提交审核 */
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">用户提交的工具</h3>
              <div className="flex gap-2">
                <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                  <Clock className="h-3 w-3" />
                  {pendingSubmissions.length} 待审核
                </Badge>
                <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Check className="h-3 w-3" />
                  {submittedTools.filter(s => s.status === 'approved').length} 已通过
                </Badge>
                <Badge className="gap-1 border-red-200 bg-red-50 text-red-700">
                  <XCircle className="h-3 w-3" />
                  {submittedTools.filter(s => s.status === 'rejected').length} 已拒绝
                </Badge>
              </div>
            </div>

            {submittedTools.length === 0 ? (
              <Card className="border-border p-12 text-center">
                <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">暂无提交记录</p>
                <p className="mt-1 text-sm text-muted-foreground/70">用户提交的工具将显示在这里</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {submittedTools.map(sub => (
                  <Card key={sub.id} className="border-border card-brand p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="font-bold">{sub.name}</h3>
                          <Badge className={
                            sub.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {sub.status === 'pending' ? '待审核' :
                             sub.status === 'approved' ? '已通过' : '已拒绝'}
                          </Badge>
                          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                            {TOOL_CATEGORIES.find(c => c.key === sub.category)?.label || sub.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.description}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>提交者：{sub.submitter} ({sub.submitterEmail})</span>
                          <span>提交时间：{new Date(sub.submittedAt).toLocaleString('zh-CN')}</span>
                          <span>定价：{PRICING_OPTIONS.find(p => p.key === sub.pricing)?.label || sub.pricing}</span>
                          {sub.url && (
                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline">
                              {sub.url}
                            </a>
                          )}
                        </div>
                        {sub.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sub.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="border-border text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {sub.status === 'pending' && (
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            size="sm"
                            onClick={() => handleSubmissionStatus(sub.id, 'approved')}
                            className="bg-emerald-500 text-white hover:bg-emerald-600"
                          >
                            <Check className="mr-1 h-3 w-3" />通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmissionStatus(sub.id, 'rejected')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="mr-1 h-3 w-3" />拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 设置 - LLM API 配置 */
          <div className="max-w-2xl space-y-6">
            <Card className="border-border p-6">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand-purple" />
                <h3 className="text-lg font-bold">大模型 API 配置</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                配置用于自动翻译和自动生成工具简介的大模型 API。支持 OpenAI 兼容接口（OpenAI / Claude / DeepSeek / 通义千问等）。
              </p>

              {/* API URL */}
              <div className="mb-4">
                <label className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <LinkIcon className="h-3 w-3" /> API 地址
                </label>
                <Input
                  value={llmConfig.apiUrl}
                  onChange={e => setLlmConfig({ ...llmConfig, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="border-border bg-card font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  OpenAI: https://api.openai.com/v1/chat/completions · DeepSeek: https://api.deepseek.com/v1/chat/completions
                </p>
              </div>

              {/* API Key */}
              <div className="mb-4">
                <label className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Key className="h-3 w-3" /> API Key
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={llmConfig.apiKey}
                    onChange={e => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                    placeholder={llmConfig.hasKey ? `已配置 (${llmConfig.apiKeyMasked || '••••••••'})，留空保留原配置` : 'sk-...'}
                    className="border-border bg-card font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {llmConfig.hasKey && (
                  <p className="mt-1 text-xs text-emerald-600">✓ 已配置 API Key{llmConfig.apiKeyMasked ? ` (${llmConfig.apiKeyMasked})` : ''}</p>
                )}
              </div>

              {/* Model */}
              <div className="mb-6">
                <label className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Bot className="h-3 w-3" /> 模型名称
                </label>
                <Input
                  value={llmConfig.model}
                  onChange={e => setLlmConfig({ ...llmConfig, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="border-border bg-card font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  推荐: gpt-4o-mini(便宜) / deepseek-chat / claude-3-5-sonnet / qwen-plus
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="gradient-brand text-white hover:brightness-110"
                >
                  <Save className="mr-1 h-4 w-4" />
                  {savingSettings ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </Card>

            <Card className="border-border p-6">
              <h3 className="mb-3 text-lg font-bold">自动化更新工具链</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-semibold">一键更新</p>
                  <code className="mt-1 block text-xs text-muted-foreground">node scripts/run-full-update.mjs --limit=20</code>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-semibold">仅审计（不抓取）</p>
                  <code className="mt-1 block text-xs text-muted-foreground">node scripts/run-full-update.mjs --skip-import</code>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-semibold">清理无价值草稿</p>
                  <code className="mt-1 block text-xs text-muted-foreground">node scripts/clean-draft.mjs --source=producthunt</code>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-semibold">草稿质量审计</p>
                  <code className="mt-1 block text-xs text-muted-foreground">node scripts/audit-tools.mjs --draft</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  配置好 API 后，自动翻译功能将读取 data/llm-config.json 调用大模型翻译英文草稿简介。
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}