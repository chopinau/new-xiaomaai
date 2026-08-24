'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, Star } from 'lucide-react'
import type { Tool } from '@/data/tools'
import { ModelCard } from '@/components/ModelCard'

interface BentoFeaturedProps {
  tools: Tool[]
}

export function BentoFeatured({ tools }: BentoFeaturedProps) {
  const featured = tools.filter((t) => t.featured)
  const list = featured.length >= 5 ? featured : [...featured, ...tools.filter((t) => !t.featured && (t.rating || 0) >= 4.5)]
  const bentoTools = list.slice(0, 5)
  const [main, ...rest] = bentoTools

  if (!main) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
          <Sparkles className="size-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-foreground">精选推荐</h2>
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-medium text-brand">Editor&apos;s Pick</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/tools/${main.slug}`}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-brand/5 to-brand-blue/5 p-6 shadow-card transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-card-hover md:col-span-2 lg:row-span-2"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand/15 blur-3xl transition group-hover:bg-brand/25" />
          <div className="relative">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-brand/10">
              {main.logoUrl ? (
                <img src={main.logoUrl} alt={main.name} className="h-8 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <span className="text-xl font-bold text-brand">{main.name.charAt(0)}</span>
              )}
            </div>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{main.name}</h3>
              <span className="rounded-md bg-brand-gradient px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">Featured</span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{main.description}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-brand">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span>{main.rating || '4.9'}</span>
              </div>
              {main.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-brand">
              立即查看
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="text-xs text-muted-foreground">
              {main.category === 'chat' && 'AI 对话'}
              {main.category === 'image' && 'AI 图像'}
              {main.category === 'video' && 'AI 视频'}
              {main.category === 'audio' && 'AI 音频'}
              {main.category === 'code' && 'AI 编程'}
              {main.category === 'productivity' && 'AI 效率'}
            </div>
          </div>
        </Link>

        {rest.map((tool) => (
          <ModelCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}
