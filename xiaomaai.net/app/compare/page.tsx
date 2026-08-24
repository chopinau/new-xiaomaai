'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, X, Plus, GitCompare } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { getCompareList, addToCompare, removeFromCompare } from '@/lib/storage'

const MAX_COMPARE = 4

const pricingLabel: Record<string, string> = {
  free: '免费',
  freemium: '免费试用',
  paid: '付费订阅',
  enterprise: '企业方案',
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toolsParam = searchParams.get('tools')

  const [allTools, setAllTools] = useState<Tool[]>([])
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddSearch, setShowAddSearch] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tools?q=&limit=500')
      .then(r => r.json())
      .then(res => {
        setAllTools(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (toolsParam) {
      const slugs = toolsParam.split(',').filter(Boolean).slice(0, MAX_COMPARE)
      setSelectedSlugs(slugs)
    } else {
      const stored = getCompareList()
      if (stored.length > 0) {
        setSelectedSlugs(stored)
        router.replace(`/compare?tools=${stored.join(',')}`, { scroll: false })
      }
    }
  }, [toolsParam, router])

  const selectedTools = allTools.filter(t => selectedSlugs.includes(t.slug))

  const filteredTools = searchQuery.trim()
    ? allTools.filter(t => {
        const q = searchQuery.toLowerCase()
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q))
        )
      }).slice(0, 20)
    : []

  const addTool = useCallback((slug: string) => {
    const updated = addToCompare(slug)
    setSelectedSlugs(updated)
    setSearchQuery('')
    setShowAddSearch(false)
    if (updated.length > 0) {
      router.replace(`/compare?tools=${updated.join(',')}`, { scroll: false })
    }
  }, [router])

  const removeTool = useCallback((slug: string) => {
    const updated = removeFromCompare(slug)
    setSelectedSlugs(updated)
    if (updated.length > 0) {
      router.replace(`/compare?tools=${updated.join(',')}`, { scroll: false })
    } else {
      router.replace('/compare', { scroll: false })
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-purple" />
        </div>
        <p className="text-sm text-muted-foreground">正在加载工具列表…</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-purple"
          >
            <ArrowLeft className="h-4 w-4" />
            返回市场
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">工具对比</h1>
          <span className="rounded-full border border-brand-purple/30 bg-brand-purple/5 px-2.5 py-0.5 text-xs font-medium text-brand-purple">
            {selectedSlugs.length}/{MAX_COMPARE}
          </span>
        </div>
      </div>

      {/* 搜索选择区（无选中工具时） */}
      {selectedSlugs.length === 0 && (
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
            <GitCompare className="h-10 w-10 text-brand-purple" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">选择要对比的工具</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            最多可选择 {MAX_COMPARE} 个同类别工具进行并排对比，帮助你找到最合适的 AI 工具
          </p>
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索工具名称、描述或标签..."
              className="h-11 w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-purple/40 focus:ring-2 focus:ring-brand-purple/15"
            />
          </div>

          {filteredTools.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-xl border border-border bg-card p-2 text-left shadow-card">
              {filteredTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool.slug)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-purple/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-purple/10">
                    {tool.logoUrl ? (
                      <img
                        src={tool.logoUrl}
                        alt={tool.name}
                        className="h-5 w-5 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-brand-purple">
                        {tool.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{tool.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{tool.category} · {pricingLabel[tool.pricing]}</div>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-brand-purple" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 已选工具标签栏 */}
      {selectedSlugs.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {selectedTools.map(tool => (
              <span
                key={tool.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/5 px-3 py-1.5 text-sm font-medium text-brand-purple"
              >
                {tool.name}
                <button
                  onClick={() => removeTool(tool.slug)}
                  className="ml-0.5 rounded-full p-0.5 transition hover:bg-brand-purple/20"
                  title={`移除 ${tool.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {selectedSlugs.length < MAX_COMPARE && (
              <div className="relative">
                <button
                  onClick={() => setShowAddSearch(!showAddSearch)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand-purple/40 px-3 py-1.5 text-sm text-brand-purple transition-all hover:border-brand-purple hover:bg-brand-purple/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加工具
                </button>
              </div>
            )}
          </div>

          {/* 添加搜索弹出 */}
          {showAddSearch && selectedSlugs.length < MAX_COMPARE && (
            <div className="relative mt-2 max-w-md">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索并添加工具..."
                    autoFocus
                    className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-purple/40 focus:ring-2 focus:ring-brand-purple/15"
                  />
                </div>
                <button
                  onClick={() => { setShowAddSearch(false); setSearchQuery('') }}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {filteredTools.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-popover p-2 shadow-lg">
                  {filteredTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => addTool(tool.slug)}
                      disabled={selectedSlugs.includes(tool.slug)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-brand-purple/5 disabled:opacity-40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-purple/10">
                        {tool.logoUrl ? (
                          <img
                            src={tool.logoUrl}
                            alt={tool.name}
                            className="h-5 w-5 rounded object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-brand-purple">
                            {tool.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">{tool.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{tool.category}</div>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-brand-purple" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 对比表格 */}
      {selectedTools.length >= 2 && (
        <div className="overflow-x-auto rounded-xl border border-border shadow-card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-muted/50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  对比项
                </th>
                {selectedTools.map(tool => (
                  <th key={tool.slug} className="bg-muted/50 px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
                        {tool.logoUrl ? (
                          <img
                            src={tool.logoUrl}
                            alt={tool.name}
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-purple">
                            {tool.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{tool.name}</div>
                        <div className="text-[10px] text-muted-foreground/70">{tool.category}</div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 描述 */}
              <tr className="border-b border-border">
                <td className="sticky left-0 z-10 bg-background px-4 py-3 text-xs font-semibold text-foreground">
                  描述
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {tool.description}
                  </td>
                ))}
              </tr>

              {/* 分类 */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-xs font-semibold text-foreground">
                  分类
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
                      {tool.category}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 价格模式 */}
              <tr className="border-b border-border">
                <td className="sticky left-0 z-10 bg-background px-4 py-3 text-xs font-semibold text-foreground">
                  价格模式
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tool.pricing === 'free'
                        ? 'bg-emerald-50 text-emerald-700'
                        : tool.pricing === 'freemium'
                        ? 'bg-brand-purple/10 text-brand-purple'
                        : tool.pricing === 'paid'
                        ? 'bg-brand-blue/10 text-brand-blue'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        tool.pricing === 'free'
                          ? 'bg-emerald-500'
                          : tool.pricing === 'freemium'
                          ? 'bg-brand-purple'
                          : tool.pricing === 'paid'
                          ? 'bg-brand-blue'
                          : 'bg-muted-foreground/50'
                      }`} />
                      {pricingLabel[tool.pricing]}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 评分 */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-xs font-semibold text-foreground">
                  评分
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    {tool.rating ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                        <svg className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {tool.rating}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/70">暂无评分</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 浏览量 */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-xs font-semibold text-foreground">
                  浏览量
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    <span className="text-xs text-muted-foreground">
                      {(tool.views || 0) >= 1000
                        ? `${(tool.views! / 1000).toFixed(1)}k`
                        : tool.views || 0}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 标签 */}
              <tr className="border-b border-border">
                <td className="sticky left-0 z-10 bg-background px-4 py-3 text-xs font-semibold text-foreground">
                  标签
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {tool.tags.length > 0 ? (
                        tool.tags.map(tag => (
                          <span
                            key={tag}
                            className="rounded-md bg-brand-purple/10 px-1.5 py-0.5 text-[10px] text-brand-purple"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/70">—</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 是否精选 */}
              <tr className="bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-xs font-semibold text-foreground">
                  精选推荐
                </td>
                {selectedTools.map(tool => (
                  <td key={tool.slug} className="px-4 py-3 text-center">
                    {tool.featured ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-purple">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
                        </svg>
                        精选
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/70">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 提示：选择不足 2 个时不显示表格 */}
      {selectedSlugs.length === 1 && (
        <div className="mx-auto max-w-lg py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
            <GitCompare className="h-8 w-8 text-brand-purple" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">请再添加一个工具</h2>
          <p className="text-sm text-muted-foreground">
            至少需要选择 2 个工具才能进行对比，最多可选 {MAX_COMPARE} 个
          </p>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-purple" />
        </div>
        <p className="text-sm text-muted-foreground">正在加载…</p>
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}