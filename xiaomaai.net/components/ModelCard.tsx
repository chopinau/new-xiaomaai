'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, MessageSquare, Sparkles, Eye, Heart } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { getToolPricing, formatPrice } from '@/data/modelPricing'
import { useToast } from '@/components/ui/toast'
import { FavoriteButton } from '@/components/FavoriteButton'

/** 数字格式化: 1000 -> 1k, 15000 -> 1.5w, 0/缺省不显示 */
function formatCount(n: number): string {
  if (!n || n <= 0) return ''
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_0000_0000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}w`
  return `${(n / 1_0000_0000).toFixed(1).replace(/\.0$/, '')}亿`
}

function getHotness(views: number | undefined, slug: string): number {
  const base = Math.max(1, Math.floor((views || 100) / 100))
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i)
    hash |= 0
  }
  const offset = Math.abs(hash) % 20
  return base + offset
}

interface ToolCardProps {
  tool: Tool
  index?: number
  large?: boolean
}

/**
 * ToolCard（新世代工具卡片）
 * - 大圆角卡片 + 品牌阴影
 * - 悬停上浮 + 图标放大
 * - Logo 失败回退首字母渐变
 * - 双操作按钮：试用画布 / 访问官网
 */
export function ToolCard({ tool, index = 0, large = false }: ToolCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const pricing = getToolPricing(tool.slug)
  const showTokens = pricing !== null

  const [logoFailed, setLogoFailed] = useState(false)

  function handleCardClick() {
    router.push(`/tools/${tool.slug}`)
  }

  function handleTryCanvas(e: React.MouseEvent) {
    e.stopPropagation()
    toast({ variant: 'info', title: `正在打开 ${tool.name}`, description: '即将跳转 AI 画布体验' })
    router.push(`/canvas?tool=${tool.slug}`)
  }

  function handleVisit(e: React.MouseEvent) {
    e.stopPropagation()
    // 优先使用 affiliate(联盟)链接,未配置回退到 url
    const target = tool.affiliate || tool.url
    toast({ variant: 'success', title: `正在访问 ${tool.name}`, description: '已在新标签页打开官网' })
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  const pricingLabel: Record<Tool['pricing'], string> = {
    free: '免费',
    freemium: '免费试用',
    paid: '付费订阅',
    enterprise: '企业方案',
  }

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick() }}
      className="group block h-full cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover ${large ? 'min-h-[180px]' : ''}`}
      >
        {/* 顶部装饰光晕 - 悬停时浮现 */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-brand-purple/0 blur-3xl transition-all duration-500 group-hover:bg-brand-purple/15" />

        {/* 收藏按钮 */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton slug={tool.slug} name={tool.name} />
        </div>

        {/* Logo + 名称 */}
        <div className="relative mb-3 flex items-center gap-3">
          <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-purple/8 to-brand-blue/8 ring-1 ring-inset ring-brand-purple/5 ${large ? 'h-12 w-12' : 'h-11 w-11'}`}
          >
            {tool.logoUrl && !logoFailed ? (
              <img
                src={tool.logoUrl}
                alt={tool.name}
                className={`object-contain transition-transform duration-500 group-hover:scale-110 ${large ? 'h-7 max-w-[80%]' : 'h-6 max-w-[80%]'}`}
                loading="lazy"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span
                className={`flex items-center justify-center rounded-lg bg-brand-gradient font-bold text-white shadow-sm ${large ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs'}`}
              >
                {tool.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={`line-clamp-1 font-semibold text-ink-900 transition-colors group-hover:text-brand-purple ${large ? 'text-lg' : 'text-sm'}`}
            >
              {tool.name}
            </h3>
            {tool.featured && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-brand-purple">
                <Sparkles className="h-3 w-3" />
                <span>精选</span>
              </div>
            )}
          </div>
        </div>

        {/* 描述 - 最多 2 行 */}
        <p className={`relative line-clamp-2 flex-1 text-ink-500/90 ${large ? 'text-sm' : 'text-xs'} leading-relaxed`}>
          {tool.description}
        </p>

        {/* 标签 - 最多 2 个,改为可点击链接(阻止冒泡避免触发卡片跳转) */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="relative mb-2 mt-2 flex flex-wrap gap-1">
            {tool.tags.slice(0, 2).map(tag => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-md bg-ink-50/80 px-1.5 py-0.5 text-[10px] text-ink-500 transition-colors hover:bg-brand-purple/15 hover:text-brand-purple"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* 价格区 + 双按钮 */}
        <div className="relative mt-auto border-t border-ink-100 pt-2.5">
          {showTokens ? (
            <div className="space-y-0.5 text-[10px] leading-tight text-ink-500">
              <div className="flex items-center justify-between">
                <span>输入</span>
                <span className="font-mono font-medium text-brand-purple">
                  {pricing!.inputYuan === 0 ? '免费' : `¥${formatPrice(pricing!.inputYuan)}/M tokens`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>输出</span>
                <span className="font-mono font-medium text-brand-blue">
                  {pricing!.outputYuan === 0 ? '免费' : `¥${formatPrice(pricing!.outputYuan)}/M tokens`}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">
                {tool.pricing === 'free' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {tool.pricing === 'freemium' && <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />}
                {tool.pricing === 'paid' && <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />}
                {tool.pricing === 'enterprise' && <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />}
                {pricingLabel[tool.pricing]}
              </div>
              {/* 热度 + 浏览/收藏(社交证明) */}
              <div className="flex items-center gap-2 text-[10px] text-ink-500">
                {typeof tool.views === 'number' && tool.views > 0 && (
                  <span className="flex items-center gap-0.5" title="浏览量">
                    <Eye className="h-2.5 w-2.5" />
                    <span>{formatCount(tool.views)}</span>
                  </span>
                )}
                {typeof tool.favorites === 'number' && tool.favorites > 0 && (
                  <span className="flex items-center gap-0.5" title="收藏数">
                    <Heart className="h-2.5 w-2.5" />
                    <span>{formatCount(tool.favorites)}</span>
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-brand-purple" title="在线使用">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-1.1 0-2.1-.3-3-.9.9-.5 1.5-1.4 1.5-2.4 0-.8-.3-1.5-.8-2 .4-.3.8-.6 1.3-.8V6.4c0-.8-.6-1.4-1.4-1.4h-.2c-.4 0-.8.2-1 .5l-2.7 4.1c-.3.5-.9.8-1.5.8H3c-1.1 0-2-.9-2-2v-1.2c0-.7.3-1.3.9-1.7L9.8 1.2C10.3.7 11 0.5 11.7 0.5h.3C13.7 0.5 15 1.8 15 3.5v2.5c.8.3 1.5.7 2.2 1.1l1.6-1.1c.5-.4 1.2-.5 1.8-.2.6.2 1.1.7 1.2 1.3l.7 4.1c.1.5-.1 1-.4 1.4-.3.4-.8.6-1.3.6h-1.5c-.2.7-.5 1.3-.8 1.8l.8.6c.5.4.8 1 .8 1.6 0 .6-.3 1.1-.8 1.4.2.4.3.8.3 1.3 0 .9-.4 1.7-1 2.2.1.3.1.6.1.9 0 .9-.4 1.7-1.1 2.2-.4.3-.8.7-1.3 1z" />
                  </svg>
                  <span className="font-medium">{getHotness(tool.views, tool.slug)}</span>
                </span>
              </div>
            </div>
          )}

          {/* 双按钮：试用画布 + 访问官网 - 悬停才显示，避免视觉杂乱 */}
          <div className="mt-2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleTryCanvas}
              className="flex h-8 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-ink-200 bg-white px-2 text-[10px] font-medium text-ink-700 transition hover:border-brand-purple hover:bg-brand-purple/5 hover:text-brand-purple"
              title={`在 AI 画布中试用 ${tool.name}`}
            >
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span>试用画布</span>
            </button>
            <button
              type="button"
              onClick={handleVisit}
              className="flex h-8 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-ink-200 bg-white px-2 text-[10px] font-medium text-ink-700 transition hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
              title={`访问 ${tool.name} 官网`}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span>访问官网</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 兼容旧 import：page.tsx 继续 import { ModelCard } from '@/components/ModelCard'
export const ModelCard = ToolCard
