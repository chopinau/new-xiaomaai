'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, ArrowRight } from 'lucide-react'

export interface BigHotTool {
  id: string
  slug: string
  name: string
  description: string
  logoUrl?: string
  category: string
  featured?: boolean
  views?: number
}

interface BigHotGridProps {
  tools: BigHotTool[]
}

/**
 * BigHotGrid - 大热门 AI 6 卡横向网格
 * 1:1 复刻 faxianai.com 紧凑卡片风格
 * - 标题：🔥 + "大热门 AI" + 右侧 more+ 灰色链接
 * - 桌面 6 列 / 平板 3 列 / 手机 2 列
 * - 卡片：圆角 8px + 浅灰边框 + 白底，hover 上浮 -2px + 紫色阴影
 * - 48x48 圆形 logo (失败回退首字母渐变)
 * - 点击跳转 /tools/[slug]
 */
export function BigHotGrid({ tools }: BigHotGridProps) {
  const router = useRouter()

  // 内部自动取前 6 个：featured 优先 + views 倒序
  const top6 = [...tools]
    .sort((a, b) => {
      const fa = a.featured ? 1 : 0
      const fb = b.featured ? 1 : 0
      if (fa !== fb) return fb - fa
      return (b.views ?? 0) - (a.views ?? 0)
    })
    .slice(0, 6)

  if (top6.length === 0) return null

  return (
    <section className="space-y-3">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="size-4 text-orange-500" />
          <h2 className="text-base font-bold text-foreground">大热门 AI</h2>
        </div>
        <Link
          href="/tools?sort=hot"
          className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-brand-purple"
        >
          more+
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* 6 卡横向网格: 手机 2 列 / 平板 3 列 / 桌面 6 列 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {top6.map((tool) => (
          <BigHotCard
            key={tool.id}
            tool={tool}
            onClick={() => router.push(`/tools/${tool.slug}`)}
          />
        ))}
      </div>
    </section>
  )
}

interface BigHotCardProps {
  tool: BigHotTool
  onClick: () => void
}

function BigHotCard({ tool, onClick }: BigHotCardProps) {
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-purple/30 hover:shadow-[0_8px_20px_rgba(124,58,237,0.18)]"
    >
      {/* 48x48 圆形 logo + 失败回退首字母渐变 */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 ring-1 ring-inset ring-brand-purple/10">
        {tool.logoUrl && !logoFailed ? (
          <img
            src={tool.logoUrl}
            alt={tool.name}
            className="h-8 w-8 object-contain"
            loading="lazy"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-sm font-bold text-white shadow-sm">
            {tool.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* 文字区 */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-purple">
          {tool.name}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {tool.description}
        </p>
      </div>
    </div>
  )
}
