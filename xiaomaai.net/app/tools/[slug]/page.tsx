'use client'

export const runtime = 'edge';

import Link from 'next/link'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ExternalLink, Star, Eye, Calendar, Sparkles, ChevronRight, Code2, Key, Webhook, Zap, Copy, Check, DollarSign, MessageSquare, GitCompare, BookOpen, Heart, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Tool } from '@/data/tools'
import { ToolCard } from '@/components/ModelCard'
import type { Article } from '@/data/articles'
import { getToolConfig, type ToolConfig } from '@/data/toolConfigs'
import { getModelPricing, getPricingColumns, getPricingVariants, formatPrice } from '@/data/modelPricing'
import { DataFreshness } from '@/components/DataFreshness'
import ShareButton from '@/components/ShareButton'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ToolTagCloud } from '@/components/tools/ToolTagCloud'
import { addRecentTool, getCompareList, addToCompare } from '@/lib/storage'
import syncMeta from '../../../data-source-cache/sync-meta.json'


export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 15: params 是 Promise，用 React 19 的 use() 同步解析
  const { slug } = use(params)
  const router = useRouter()
  const [tool, setTool] = useState<Tool | null>(null)
  const [related, setRelated] = useState<Tool[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [relatedManuals, setRelatedManuals] = useState<ManualMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCode, setActiveCode] = useState(0)
  const [copied, setCopied] = useState(false)
  const [inCompare, setInCompare] = useState(false)
  const [alternatives, setAlternatives] = useState<Tool[]>([])

  useEffect(() => {
    setInCompare(getCompareList().includes(slug))
  }, [slug])

  const handleCompare = useCallback(() => {
    const updated = addToCompare(slug)
    setInCompare(true)
    router.push(`/compare?tools=${updated.join(',')}`)
  }, [slug, router])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/tools?q=&limit=500`).then(r => r.json()),
      fetch(`/api/articles?limit=20`).then(r => r.json()),
    ]).then(([toolsRes, articlesRes]) => {
      const allTools = toolsRes.data || []
      const t = allTools.find((x: Tool) => x.slug === slug)
      if (!t) {
        setTool(null)
        setLoading(false)
        return
      }
      setTool(t)
      setAlternatives((t.alternatives || []).map(slug => allTools.find((x: Tool) => x.slug === slug)).filter((x): x is Tool => Boolean(x)))
      setRelated(allTools.filter((x: Tool) => x.id !== t.id && x.category === t.category).slice(0, 4))
      const arts = (articlesRes.data || []) as Article[]
      setArticles(arts.filter(a => a.relatedToolSlugs?.includes(slug)).slice(0, 3))
      setLoading(false)
    }).catch((err) => {
      console.error('[ToolDetail] fetch failed:', err)
      setTool(null)
      setAlternatives([])
      setLoading(false)
    })
  }, [slug])

  // 记录最近浏览
  useEffect(() => {
    if (!tool) return
    addRecentTool(tool.slug, tool.name)
  }, [tool])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-background/80">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-purple" />
        </div>
        <p className="text-sm text-muted-foreground">正在加载工具详情…</p>
      </div>
    )
  }

  // 数据加载完成，但 tool 不存在 → 404
  if (!tool) {
    notFound()
  }

  const config = getToolConfig(tool.slug)
  const pricingMap: Record<string, { label: string; className: string }> = {
    free:       { label: '完全免费', className: 'border-border text-muted-foreground' },
    freemium:   { label: '免费试用', className: 'border-border text-muted-foreground' },
    paid:       { label: '付费订阅', className: 'border-border text-muted-foreground' },
    enterprise: { label: '企业版',   className: 'border-border text-muted-foreground' },
  }
  const pricing = pricingMap[tool.pricing] || pricingMap.freemium
  const modelPricingData = getModelPricing(tool.slug)
  const pricingCols = modelPricingData ? getPricingColumns(modelPricingData) : null
  // 即使直接定价为 null，也要查变体列表（chatgpt 关联 gpt-5.5 / gpt-5.4-mini / o3）
  const variants = getPricingVariants(tool.slug)

  return (
    <div className="bg-white text-foreground">
      {/* Hero - 使用品牌色渐变背景,提升视觉层次 */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-purple/[0.03] to-background">
        {/* 装饰光晕 */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-purple/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-brand-blue/6 blur-3xl" />
        <div className="container mx-auto px-4 py-10">
          <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-brand-purple">市场</Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span>{tool.category}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{tool.name}</span>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-white shadow-card transition-all duration-300 hover:shadow-card-hover">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-purple/8 to-brand-blue/8 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {tool.logoUrl ? (
                <img
                  src={tool.logoUrl}
                  alt={tool.name}
                  className="relative h-14 w-14 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                    if (next) next.style.display = 'flex'
                  }}
                />
              ) : null}
              <span className="relative text-3xl font-bold text-brand-purple" style={{ display: tool.logoUrl ? 'none' : 'flex' }}>
                {tool.name.charAt(0)}
              </span>
            </div>

            <div className="flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{tool.name}</h1>
                <FavoriteButton slug={tool.slug} name={tool.name} className="scale-125" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompare}
                  className="h-8 gap-1.5 border-brand-purple/30 bg-white px-2.5 text-xs text-brand-purple transition-all hover:bg-brand-purple/5 hover:border-brand-purple"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  {inCompare ? '已加入对比' : '加入对比'}
                </Button>
                {tool.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                    <Sparkles className="h-3 w-3" /> 推荐
                  </span>
                )}
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${pricing.className}`}>
                  {pricing.label}
                </span>
              </div>
              <p className="mb-4 text-xl font-medium leading-relaxed text-foreground/80">
                {tool.description.split(/[。!?\n]/)[0]}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {tool.rating !== undefined && tool.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{tool.rating}</span>
                    <span>用户评分</span>
                  </span>
                )}
                {tool.rating !== undefined && tool.rating > 0 && tool.views !== undefined && tool.views > 0 && (
                  <span className="text-muted-foreground/40">·</span>
                )}
                {tool.views !== undefined && tool.views > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{(tool.views / 1000).toFixed(1)}k 浏览</span>
                  </span>
                )}
                {tool.views !== undefined && tool.views > 0 && tool.favorites !== undefined && tool.favorites > 0 && (
                  <span className="text-muted-foreground/40">·</span>
                )}
                {tool.favorites !== undefined && tool.favorites > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{tool.favorites} 收藏</span>
                  </span>
                )}
                {tool.favorites !== undefined && tool.favorites > 0 && tool.createdAt && (
                  <span className="text-muted-foreground/40">·</span>
                )}
                {tool.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>收录于 {(() => {
                      const d = new Date(tool.createdAt)
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    })()}</span>
                  </span>
                )}
                {tool.createdAt && tool.updatedAt && (
                  <span className="text-muted-foreground/40">·</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>更新于 {new Date(tool.updatedAt).toLocaleDateString('zh-CN')}</span>
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button asChild className="h-10 gap-1.5 rounded-xl bg-brand-purple px-5 text-white shadow-sm transition-all hover:bg-brand-deep hover:shadow-md">
                  <a href={tool.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    打开网站
                  </a>
                </Button>
                <Button asChild className="h-10 gap-1.5 rounded-xl bg-amber-100 px-5 text-amber-900 shadow-sm transition-all hover:bg-amber-200 hover:shadow-md">
                  <a href={tool.affiliate || tool.url} target="_blank" rel="noreferrer">
                    <Sparkles className="h-3.5 w-3.5" />
                    火爆全球！立即体验最好用的 AI 生图工具
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-10 gap-1.5 rounded-xl border-brand-purple/30 bg-white px-5 text-brand-purple transition-all hover:bg-brand-purple/5 hover:border-brand-purple">
                  <Link href={`/canvas?tool=${tool.slug}`}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    立即试用
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10 gap-1.5 rounded-xl border-border bg-white px-5 text-foreground transition-all hover:border-brand-purple/50 hover:text-brand-purple">
                  <Link href="/articles">
                    <BookOpen className="h-3.5 w-3.5" />
                    查看教程
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-3">
        {/* 主内容 */}
        <div className="space-y-5 lg:col-span-2">
          {/* 标签 - 升级为 ToolTagCloud 组件 */}
          {tool.tags.length > 0 && (
            <div className="border-b border-border pb-4">
              <ToolTagCloud tags={tool.tags} category={tool.category} />
            </div>
          )}

          {/* 详细介绍 */}
          <Card className="border-border bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-foreground">工具介绍</h2>
            <div className="prose max-w-none">
              {tool.description.split(/(?<=[。!?\n])\s*/).filter(p => p.trim().length > 0).map((p, i) => (
                <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/80">{p}</p>
              ))}

              <h3 className="mt-5 text-base font-semibold text-foreground">价格说明</h3>
              <p className="mt-1.5 text-sm text-foreground/80">
                {tool.pricing === 'free' && '完全免费使用，无功能限制。'}
                {tool.pricing === 'freemium' && '免费版提供基础功能，付费版解锁更多高级特性。'}
                {tool.pricing === 'paid' && '付费订阅制，按月或按年收费。'}
                {tool.pricing === 'enterprise' && '面向企业客户的定制化方案。'}
              </p>
            </div>
          </Card>

          {/* 详细介绍 - SEO 内容厚度 */}
          {tool.fullDescription && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 text-lg font-bold text-foreground">详细介绍</h2>
              <p className="text-sm leading-relaxed text-foreground/80">{tool.fullDescription}</p>
            </Card>
          )}

          {/* 优缺点对比 */}
          {(tool.pros?.length || tool.cons?.length) && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-4 text-lg font-bold text-foreground">优缺点对比</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-green-200/70 bg-green-50/40 p-4">
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-green-700">
                    <ThumbsUp className="h-4 w-4" />
                    优点
                  </h3>
                  <ul className="space-y-2">
                    {tool.pros?.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-200/70 bg-red-50/40 p-4">
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-red-700">
                    <ThumbsDown className="h-4 w-4" />
                    缺点
                  </h3>
                  <ul className="space-y-2">
                    {tool.cons?.map(c => (
                      <li key={c} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* 适用场景 */}
          {tool.scenarios?.length ? (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 text-lg font-bold text-foreground">适用场景</h2>
              <div className="flex flex-wrap gap-2">
                {tool.scenarios.map(s => (
                  <span
                    key={s}
                    className="rounded-full border border-brand-purple/25 bg-brand-purple/5 px-3.5 py-1.5 text-xs font-medium text-brand-purple"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {/* 同类替代工具 */}
          {alternatives.length > 0 && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 text-lg font-bold text-foreground">同类替代工具</h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {alternatives.map(alt => (
                  <Link
                    key={alt.id}
                    href={`/tools/${alt.slug}`}
                    title={`查看 ${alt.name} 的详细介绍`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-all duration-200 hover:border-brand-purple/40 hover:bg-brand-purple/[0.02] hover:shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-purple/8 to-brand-blue/8 ring-1 ring-inset ring-brand-purple/5">
                      {alt.logoUrl ? (
                        <img
                          src={alt.logoUrl}
                          alt={alt.name}
                          className="h-6 w-6 object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fb = e.currentTarget.nextElementSibling as HTMLElement
                            if (fb) fb.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xs font-bold text-brand-purple"
                        style={{ display: alt.logoUrl ? 'none' : 'flex' }}
                      >
                        {alt.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-purple">
                        {alt.name}
                      </h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{alt.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-brand-purple" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* 定价对比表 - 302.ai 核心元素 */}
          {(modelPricingData || variants.length > 0) && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <DollarSign className="h-4 w-4 text-foreground/80" />
                定价详情
                {modelPricingData?.note && (
                  <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                    {modelPricingData.note}
                  </span>
                )}
                <span className="ml-auto">
                  <DataFreshness meta={syncMeta} variant="inline" />
                </span>
              </h2>

              {/* 4 列价格展示（输入/输出/缓存读/缓存写） - 仅当有直接定价时显示 */}
              {modelPricingData && pricingCols && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {pricingCols.map((col, i) => {
                      const isFree = col.yuan === 0 || col.yuan === null
                      return (
                        <div key={i} className="rounded border border-border p-2.5">
                          <div className="mb-1 text-[11px] text-muted-foreground">{col.label}</div>
                          <div className={`font-mono text-lg font-semibold ${isFree ? 'text-muted-foreground/70' : 'text-foreground'}`}>
                            {col.yuan === null ? '—' : col.yuan === 0 ? '免费' : `¥${formatPrice(col.yuan)}`}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground/70">¥/M tokens</div>
                        </div>
                      )
                    })}
                  </div>

                  {modelPricingData.contextWindow && (
                    <div className="mt-2.5 text-[11px] text-muted-foreground">
                      上下文窗口：{modelPricingData.contextWindow.toLocaleString()} tokens
                    </div>
                  )}
                </>
              )}

              {/* 无直接定价但有变体时的提示 */}
              {!modelPricingData && variants.length > 0 && (
                <div className="mb-3 rounded border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
                  {tool.name} 包含多个模型变体，下方为各变体定价对比。
                </div>
              )}

              {/* 同模型变体对比表 */}
              {variants.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">同模型变体对比</h3>
                  <div className="overflow-x-auto rounded border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-2.5 py-1.5 text-left font-semibold text-foreground/80">变体</th>
                          <th className="px-2.5 py-1.5 text-right font-semibold text-foreground/80">输入</th>
                          <th className="px-2.5 py-1.5 text-right font-semibold text-foreground/80">输出</th>
                          <th className="px-2.5 py-1.5 text-right font-semibold text-foreground/80">缓存读</th>
                          <th className="px-2.5 py-1.5 text-right font-semibold text-foreground/80">缓存写</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, i) => {
                          const isRecommended = v.note === '推荐' || v.note === '性价比' || v.note === '国产推荐'
                          return (
                            <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50/50">
                              <td className="px-2.5 py-1.5 text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold">{v.slug}</span>
                                  {isRecommended && (
                                    <span className="rounded border border-green-200 bg-green-50 px-1 py-0.5 text-[10px] text-green-700">
                                      {v.note}
                                    </span>
                                  )}
                                  {v.note && !isRecommended && (
                                    <span className="text-[10px] text-muted-foreground/70">{v.note}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-mono text-foreground/80">
                                {v.inputYuan === 0 ? '免费' : `¥${formatPrice(v.inputYuan)}`}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-mono text-foreground/80">
                                {v.outputYuan === 0 ? '免费' : `¥${formatPrice(v.outputYuan)}`}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground">
                                {v.cachedInputYuan === undefined ? '—' : `¥${formatPrice(v.cachedInputYuan)}`}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground">
                                {v.cachedOutputYuan === undefined ? '—' : `¥${formatPrice(v.cachedOutputYuan)}`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* API 配置教程 */}
          {config && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <Code2 className="h-4 w-4 text-foreground/80" />
                API 配置教程
              </h2>

              <div className="space-y-3.5">
                {/* 基础信息 */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {config.apiBase && (
                    <div className="rounded border border-border p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Webhook className="h-3 w-3" />
                        API Endpoint
                      </div>
                      <code className="break-all text-xs text-foreground">{config.apiBase}</code>
                    </div>
                  )}
                  {config.authMethod && (
                    <div className="rounded border border-border p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Key className="h-3 w-3" />
                        认证方式
                      </div>
                      <code className="text-xs text-foreground">
                        {config.authMethod === 'api_key' && 'API Key (Header)'}
                        {config.authMethod === 'bearer' && 'Bearer Token'}
                        {config.authMethod === 'oauth' && 'OAuth 2.0'}
                        {config.authMethod === 'none' && '无需认证'}
                      </code>
                    </div>
                  )}
                  {config.rateLimit && (
                    <div className="rounded border border-border p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        限速
                      </div>
                      <code className="text-xs text-foreground">{config.rateLimit}</code>
                    </div>
                  )}
                  {config.signupUrl && (
                    <div className="rounded border border-border p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        申请密钥
                      </div>
                      <a
                        href={config.signupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-foreground hover:underline"
                      >
                        立即注册 →
                      </a>
                    </div>
                  )}
                </div>

                {/* 价格层级 */}
                {config.pricingTiers && config.pricingTiers.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">价格方案</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {config.pricingTiers.map((tier, i) => (
                        <div key={i} className="rounded border border-border p-2.5">
                          <div className="mb-1 flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-foreground">{tier.name}</span>
                            <span className="text-[11px] text-foreground/80">{tier.price}</span>
                          </div>
                          <div className="mb-1.5 text-[11px] text-muted-foreground">{tier.quota}</div>
                          <ul className="space-y-0.5 text-[11px] text-foreground/80">
                            {tier.features.map((f, j) => (
                              <li key={j}>• {f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SDK 支持 */}
                {config.sdkLanguages && config.sdkLanguages.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">SDK 支持</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {config.sdkLanguages.map(sdk => (
                        <span key={sdk} className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {sdk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 代码示例 */}
                {config.codeExamples && config.codeExamples.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-foreground/80">代码示例</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const code = config.codeExamples![activeCode].code
                          navigator.clipboard.writeText(code).then(() => {
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          })
                        }}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? '已复制' : '复制代码'}
                      </Button>
                    </div>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {config.codeExamples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveCode(i)}
                          className={`rounded px-2 py-0.5 text-[11px] transition ${
                            activeCode === i
                              ? 'bg-brand-purple text-white'
                              : 'border border-border bg-white text-muted-foreground hover:border-brand-purple hover:text-brand-purple'
                          }`}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-foreground/80 bg-foreground p-3.5 text-xs leading-relaxed shadow-inner">
                      <code className="text-white/90">{config.codeExamples[activeCode].code}</code>
                    </pre>
                  </div>
                )}

                {/* 备注 */}
                {config.notes && (
                  <div className="rounded border border-border p-2.5 text-xs text-foreground/80">
                    💡 {config.notes}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 关联操作手册(P1b: 手册↔工具双向打通) */}
          {relatedManuals.length > 0 && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">相关操作手册</h2>
                <Link href="/manuals" className="text-xs text-emerald-600 hover:underline">查看全部 →</Link>
              </div>
              <div className="space-y-2">
                {relatedManuals.map(m => (
                  <Link key={m.slug} href={`/manuals/${m.slug}`} className="block">
                    <div className="rounded border border-emerald-100 bg-white p-3 transition-all duration-200 hover:border-emerald-400 hover:shadow-sm">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {m.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {(m.views / 1000).toFixed(1)}k 阅读
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* 关联教程 */}
          {articles.length > 0 && (
            <Card className="border-border bg-white p-5">
              <h2 className="mb-3 text-lg font-bold text-foreground">相关教程</h2>
              <div className="space-y-2">
                {articles.map(article => (
                  <Link key={article.id} href={`/articles/${article.slug}`} className="block">
                    <div className="rounded border border-border bg-white p-3 transition-all duration-200 hover:border-brand-purple/40 hover:shadow-sm">
                      <span className="mb-1 inline-block text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {article.category === 'tutorial' ? '教程' :
                          article.category === 'review' ? '评测' : '资讯'}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{article.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{article.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* 相关工具推荐 */}
          {related.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-foreground">相关工具推荐</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {related.map((r, i) => (
                  <ToolCard key={r.id} tool={r} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-5">
          {/* 快捷操作 */}
          <Card className="border-border bg-white p-5">
            <h3 className="mb-3 text-base font-bold text-foreground">快捷操作</h3>
            <div className="space-y-2">
              <Button asChild className="h-10 w-full gap-1.5 rounded-xl bg-brand-purple text-white shadow-sm transition-all hover:bg-brand-deep hover:shadow-md">
                <a href={tool.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  访问官网
                </a>
              </Button>
              <Button asChild variant="outline" className="h-10 w-full gap-1.5 rounded-xl border-border bg-white text-foreground transition-all hover:border-brand-purple/50 hover:text-brand-purple">
                <Link href="/canvas">
                  <MessageSquare className="h-3.5 w-3.5" />
                  试用 AI 画布
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 w-full gap-1.5 rounded-xl border-border bg-white text-foreground transition-all hover:border-brand-purple/50 hover:text-brand-purple">
                <Link href="/prompts">
                  <BookOpen className="h-3.5 w-3.5" />
                  浏览提示词
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 分享 */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex items-center justify-center border-t border-border pt-6">
          <ShareButton
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={tool.name}
            description={tool.description}
          />
        </div>
      </div>
    </div>
  )
}
