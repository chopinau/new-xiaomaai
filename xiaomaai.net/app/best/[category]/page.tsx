'use client'

import { use, useEffect, useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music,
  Code2,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  DollarSign,
  ExternalLink,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { ToolCard } from '@/components/ModelCard'
import { getModelPricing, formatPrice } from '@/data/modelPricing'
import type { Tool } from '@/data/tools'

const CATEGORY_MAP: Record<string, { label: string; icon: typeof MessageSquare; description: string }> = {
  chat: {
    label: 'AI对话',
    icon: MessageSquare,
    description: '精选全球顶尖 AI 对话助手，从 ChatGPT、Claude 到 DeepSeek，覆盖写作、翻译、编程辅助、知识问答等场景，帮你找到最适合的 AI 聊天工具。',
  },
  image: {
    label: 'AI图像',
    icon: ImageIcon,
    description: '汇聚 Midjourney、DALL·E、Stable Diffusion 等主流 AI 图像生成工具，支持文生图、图生图、风格迁移、AI 修图等功能，满足创作与设计需求。',
  },
  video: {
    label: 'AI视频',
    icon: Video,
    description: '收录 Sora、Runway、Pika 等领先 AI 视频生成与编辑工具，涵盖文生视频、图生视频、视频剪辑、数字人播报等能力，让视频创作更高效。',
  },
  audio: {
    label: 'AI音频',
    icon: Music,
    description: '精选 ElevenLabs、Suno、Murf 等 AI 音频工具，支持语音合成、音乐生成、语音克隆、配音翻译等场景，打造专业级音频内容。',
  },
  code: {
    label: 'AI编程',
    icon: Code2,
    description: '汇集 GitHub Copilot、Cursor、Codeium 等 AI 编程助手，覆盖代码补全、代码审查、Bug 修复、自动化测试等开发场景，提升编码效率。',
  },
  productivity: {
    label: 'AI效率',
    icon: LayoutDashboard,
    description: '整合 Notion AI、Gamma、Perplexity 等 AI 效率工具，涵盖文档写作、PPT 生成、数据分析、知识管理等场景，助力高效办公。',
  },
}

export default function BestCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params)
  const categoryInfo = CATEGORY_MAP[category]

  if (!categoryInfo) {
    notFound()
  }

  const { label, icon: Icon, description } = categoryInfo

  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tools?category=${category}&limit=500`)
      .then(r => r.json())
      .then(res => {
        setTools(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category])

  // SEO 动态元数据
  useEffect(() => {
    document.title = `2026 年最佳 ${label} 工具 | 小马AI`
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', `精选 ${tools.length} 款${label}工具，涵盖免费和付费方案，帮你找到最适合的 AI 工具。`)
  }, [label, tools.length])

  // 价格对比数据
  const toolsWithPricing = useMemo(() => {
    return tools.map(tool => {
      const pricing = getModelPricing(tool.slug)
      return { tool, pricing }
    })
  }, [tools])

  const freeCount = tools.filter(t => t.pricing === 'free').length
  const freemiumCount = tools.filter(t => t.pricing === 'freemium').length
  const paidCount = tools.filter(t => t.pricing === 'paid').length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `2026 年最佳 ${label} 工具推荐`,
    description: `精选 ${tools.length} 款${label}工具，涵盖免费和付费方案，帮你找到最适合的 AI 工具。`,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        url: tool.url,
        applicationCategory: 'AIApplication',
        offers: {
          '@type': 'Offer',
          price: tool.pricing === 'free' ? '0' : undefined,
          priceCurrency: 'CNY',
        },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />

      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-brand-purple/5 via-brand-blue/3 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* 分类图标 */}
            <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue p-3 shadow-lg shadow-brand-purple/20">
              <Icon className="h-8 w-8 text-white" />
            </div>

            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              2026 年最佳{' '}
              <span className="text-gradient-brand">{label}</span>{' '}
              工具推荐
            </h1>

            <p className="mb-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>

            {/* 统计概览 */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 rounded-full border border-brand-purple/20 bg-brand-purple/5 px-4 py-2">
                <Sparkles className="h-4 w-4 text-brand-purple" />
                <span className="text-sm font-medium text-foreground">
                  共收录 <strong>{tools.length}</strong> 款工具
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  <strong>{freeCount}</strong> 款免费
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  <strong>{freemiumCount + paidCount}</strong> 款付费
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 工具网格 */}
        <section className="mb-10">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-brand-purple" />
            {label} 工具列表
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 animate-shimmer rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : tools.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">暂无 {label} 工具</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* 价格对比区域 */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
            <DollarSign className="h-5 w-5 text-brand-purple" />
            价格对比
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            以下是 {label} 工具的定价模式分布，帮助你根据预算选择合适方案。
          </p>

          {/* 价格分布条形图 */}
          <div className="mb-6 space-y-3">
            {[
              { label: '免费', count: freeCount, color: 'bg-emerald-500', bg: 'bg-emerald-100' },
              { label: '免费试用', count: freemiumCount, color: 'bg-brand-purple', bg: 'bg-brand-purple/10' },
              { label: '付费订阅', count: paidCount, color: 'bg-brand-blue', bg: 'bg-brand-blue/10' },
              { label: '企业方案', count: tools.filter(t => t.pricing === 'enterprise').length, color: 'bg-ink-400', bg: 'bg-ink-100' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-muted-foreground">{item.label}</span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: tools.length > 0 ? `${(item.count / tools.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Token 价格表格（仅显示有定价的工具） */}
          {toolsWithPricing.filter(tp => tp.pricing !== null).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">工具</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">输入价格</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">输出价格</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">访问</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {toolsWithPricing
                    .filter(tp => tp.pricing !== null)
                    .slice(0, 10)
                    .map(({ tool, pricing }) => (
                      <tr key={tool.slug} className="transition-colors hover:bg-muted/50">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
                              {tool.logoUrl ? (
                                <img
                                  src={tool.logoUrl}
                                  alt={tool.name}
                                  className="h-4 w-4 rounded object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-brand-purple">
                                  {tool.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-foreground">{tool.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          {pricing!.inputYuan === 0 ? (
                            <span className="text-emerald-600 font-semibold">免费</span>
                          ) : (
                            <span className="text-foreground">¥{formatPrice(pricing!.inputYuan)}/M</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          {pricing!.outputYuan === 0 ? (
                            <span className="text-emerald-600 font-semibold">免费</span>
                          ) : (
                            <span className="text-foreground">¥{formatPrice(pricing!.outputYuan)}/M</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-purple transition hover:text-brand-blue"
                          >
                            访问 <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {toolsWithPricing.filter(tp => tp.pricing !== null).length > 10 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  仅显示前 10 个有定价数据的工具，完整列表请查看上方工具卡片。
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}