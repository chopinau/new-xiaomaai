'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutGrid,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music,
  Code2,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'

const CATEGORIES = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'chat', label: 'AI 对话', icon: MessageSquare },
  { key: 'image', label: 'AI 图像', icon: ImageIcon },
  { key: 'video', label: 'AI 视频', icon: Video },
  { key: 'audio', label: 'AI 音频', icon: Music },
  { key: 'code', label: 'AI 编程', icon: Code2 },
  { key: 'productivity', label: 'AI 效率', icon: LayoutDashboard },
]

const VENDORS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Meta',
  'DeepSeek',
  'xAI',
  'Mistral',
  '阿里',
  '百度',
  '字节',
]

interface CategorySidebarProps {
  category: string
  setCategory: (c: string) => void
  counts: Record<string, number>
}

export function CategorySidebar({ category, setCategory, counts }: CategorySidebarProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'app'>('model')

  return (
    <aside className="sticky top-[84px] hidden h-fit w-full lg:block">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
          {(['model', 'app'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={cn(
                'rounded-lg py-1.5 text-sm font-medium transition-all duration-200',
                activeTab === t
                  ? 'bg-card text-brand-purple shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'model' ? 'AI 模型' : '应用工具'}
            </button>
          ))}
        </div>

        <nav className="flex flex-col gap-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = category === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-200',
                  isActive
                    ? 'bg-brand-purple/10 text-brand-purple'
                    : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-brand-purple text-white shadow-sm'
                      : 'bg-brand-purple/8 text-brand-purple group-hover:bg-brand-purple/15'
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{cat.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums transition-colors',
                    isActive ? 'bg-brand-purple/20 text-brand-purple' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {counts[cat.key] ?? 0}
                </span>
                <ChevronRight
                  className={cn(
                    'size-3.5 shrink-0 transition-transform duration-200',
                    isActive
                      ? 'translate-x-0.5 text-brand-purple'
                      : 'text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-brand-purple/60'
                  )}
                />
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-foreground">热门厂商</h3>
        <div className="flex flex-wrap gap-1.5">
          {VENDORS.map((v) => (
            <span
              key={v}
              className="cursor-default rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-all hover:border-brand-purple/40 hover:bg-brand-purple/5 hover:text-brand-purple"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}
