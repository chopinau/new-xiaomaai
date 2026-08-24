'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Top10Tool {
  id: string
  slug: string
  name: string
  description: string
  logoUrl?: string
  category: string
}

export interface Top10Tab {
  id: string
  label: string
  category: string
}

interface Top10TabsProps {
  tools: Top10Tool[]
}

const TABS: readonly Top10Tab[] = [
  { id: 'image', label: '图像 AI TOP10', category: 'image' },
  { id: 'chat', label: '对话 AI TOP10', category: 'chat' },
  { id: 'video', label: '视频 AI TOP10', category: 'video' },
  { id: 'office', label: '办公 AI TOP10', category: 'productivity' },
  { id: 'audio', label: '音频 AI TOP10', category: 'audio' },
  { id: 'code', label: '开发 AI TOP10', category: 'code' },
  { id: 'research', label: '论文 AI TOP10', category: 'productivity' },
] as const

const DEFAULT_TAB_ID: Top10Tab['id'] = 'image'

export function Top10Tabs({ tools }: Top10TabsProps) {
  const [activeId, setActiveId] = useState<Top10Tab['id']>(DEFAULT_TAB_ID)

  const activeTab: Top10Tab =
    TABS.find((tab) => tab.id === activeId) ?? TABS[0]

  const currentTools: Top10Tool[] = tools
    .filter((tool) => tool.category === activeTab.category)
    .slice(0, 10)

  return (
    <section className="space-y-4">
      {/* 标题区：🏆 + TOP 10 + 当前 tab 名 + more+ */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
            <Trophy className="size-4 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            TOP 10
          </h2>
          <span className="text-base font-semibold text-rose-500 sm:text-lg">
            🔥 {activeTab.label}
          </span>
        </div>
        <Link
          href="/rankings"
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          more+
        </Link>
      </div>

      {/* 7 个 tab 横向 */}
      <div className="border-b border-border">
        <div className="-mb-px flex gap-4 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = tab.id === activeId
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  'relative shrink-0 whitespace-nowrap pb-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-rose-500'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[3px] rounded-t bg-rose-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 当前 tab 内容：top 10 卡片网格 */}
      {currentTools.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {currentTools.map((tool, index) => (
            <Top10Card key={tool.id} tool={tool} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
          该赛道暂无工具
        </div>
      )}
    </section>
  )
}

interface Top10CardProps {
  tool: Top10Tool
  rank: number
}

function Top10Card({ tool, rank }: Top10CardProps) {
  const initial = tool.name.charAt(0).toUpperCase()
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-rose-50 px-1 text-[10px] font-bold text-rose-500">
          {rank}
        </span>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-rose-50 to-amber-50 ring-1 ring-inset ring-rose-100">
          {tool.logoUrl ? (
            <img
              src={tool.logoUrl}
              alt={tool.name}
              className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-rose-500 to-amber-500 text-sm font-bold text-white">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-rose-500">
            {tool.name}
          </h3>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
        {tool.description}
      </p>
    </Link>
  )
}

export default Top10Tabs
