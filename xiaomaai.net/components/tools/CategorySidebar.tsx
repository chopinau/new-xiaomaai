'use client'

import type { FC, MouseEvent } from 'react'
import {
  TrendingUp,
  Sparkles,
  BookOpen,
  Bot,
  PlusCircle,
  Building2,
  PenTool,
  Image as ImageIcon,
  Palette,
  Briefcase,
  MessageCircle,
  AppWindow,
  Headphones,
  Music,
  Search,
  MessageSquare,
  Video,
  Music2,
  Code2,
  Zap,
} from 'lucide-react'

export interface CategorySidebarProps {
  currentCat?: string
  onSelect?: (catId: string) => void
  catCounts?: Record<string, number>
  toolCategory?: string
  onToolCategorySelect?: (category: string) => void
  toolCategoryCounts?: Record<string, number>
}

interface CategoryItem {
  id: string
  label: string
  icon: FC<{ className?: string }>
  defaultCount: number
}

const CATEGORIES: CategoryItem[] = [
  { id: 'cat-hot', label: '大热门 AI', icon: TrendingUp, defaultCount: 12 },
  { id: 'cat-top10', label: 'TOP 10', icon: Sparkles, defaultCount: 12 },
  { id: 'cat-manuals', label: 'AI 操作手册', icon: BookOpen, defaultCount: 12 },
  { id: 'cat-agent', label: '超级智能体', icon: Bot, defaultCount: 12 },
  { id: 'cat-new', label: '新出 AI', icon: PlusCircle, defaultCount: 12 },
  { id: 'cat-big', label: '大厂 AI', icon: Building2, defaultCount: 12 },
  { id: 'cat-write', label: '写作 AI', icon: PenTool, defaultCount: 12 },
  { id: 'cat-image', label: '图像 AI', icon: ImageIcon, defaultCount: 12 },
  { id: 'cat-design', label: '设计 AI', icon: Palette, defaultCount: 12 },
  { id: 'cat-office', label: '办公 AI', icon: Briefcase, defaultCount: 12 },
  { id: 'cat-chat', label: '对话 AI', icon: MessageCircle, defaultCount: 12 },
  { id: 'cat-app', label: '热门 APP', icon: AppWindow, defaultCount: 12 },
  { id: 'cat-yin', label: '银顾 AI', icon: Headphones, defaultCount: 12 },
  { id: 'cat-audio', label: '音频 AI', icon: Music, defaultCount: 12 },
  { id: 'cat-job', label: '求职招聘 AI', icon: Search, defaultCount: 12 },
]

interface ToolCategoryItem {
  key: string
  label: string
  icon: FC<{ className?: string }>
}

const TOOL_CATEGORIES: ToolCategoryItem[] = [
  { key: 'chat', label: '对话AI', icon: MessageSquare },
  { key: 'image', label: '图像AI', icon: ImageIcon },
  { key: 'video', label: '视频AI', icon: Video },
  { key: 'audio', label: '音频AI', icon: Music2 },
  { key: 'code', label: '开发AI', icon: Code2 },
  { key: 'productivity', label: '办公AI', icon: Zap },
]

export const CategorySidebar: FC<CategorySidebarProps> = ({
  currentCat,
  onSelect,
  catCounts,
  toolCategory,
  onToolCategorySelect,
  toolCategoryCounts,
}) => {
  const handleClick =
    (catId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (onSelect) {
        event.preventDefault()
        onSelect(catId)
        return
      }
      event.preventDefault()
      const target = document.getElementById(catId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

  const handleToolCategoryClick =
    (category: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onToolCategorySelect?.(category)
    }

  return (
    <aside className="rounded-xl border border-border bg-white p-2">
      <nav className="flex flex-col gap-0.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = currentCat === cat.id
          const count = catCounts?.[cat.id] ?? cat.defaultCount
          return (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              onClick={handleClick(cat.id)}
              className={[
                'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
                isActive
                  ? 'bg-brand-purple pl-3.5 font-semibold text-white shadow-sm'
                  : 'text-ink-700 hover:translate-x-1 hover:bg-brand-purple/10 hover:text-brand-purple',
              ].join(' ')}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-purple" />
              ) : null}
              <Icon
                className={[
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-brand-purple/70 group-hover:text-brand-purple',
                ].join(' ')}
              />
              <span className="flex-1 truncate">{cat.label}</span>
              <span
                className={[
                  'flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-red-500 text-white group-hover:bg-red-600',
                ].join(' ')}
              >
                {count}
              </span>
            </a>
          )
        })}
      </nav>

      {/* 工具分类区块 */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-1.5 px-2.5 text-xs font-semibold text-ink-500">
          工具分类
        </div>
        <nav className="flex flex-col gap-0.5">
          {TOOL_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = toolCategory === cat.key
            const count = toolCategoryCounts?.[cat.key] ?? 0
            return (
              <a
                key={cat.key}
                href={`#cat-all`}
                onClick={handleToolCategoryClick(cat.key)}
                className={[
                  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-brand-purple pl-3.5 font-semibold text-white shadow-sm'
                    : 'text-ink-700 hover:translate-x-1 hover:bg-brand-purple/10 hover:text-brand-purple',
                ].join(' ')}
              >
                {isActive ? (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-purple" />
                ) : null}
                <Icon
                  className={[
                    'h-3.5 w-3.5 shrink-0 transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-brand-purple/70 group-hover:text-brand-purple',
                  ].join(' ')}
                />
                <span className="flex-1 truncate">{cat.label}</span>
                <span
                  className={[
                    'flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-brand-purple/20 group-hover:text-brand-purple',
                  ].join(' ')}
                >
                  {count}
                </span>
              </a>
            )
          })}
        </nav>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border px-2.5 pt-2 text-[11px] text-ink-500">
        <a
          href="#default-nav"
          className="transition-colors hover:text-brand-purple"
        >
          默认导航
        </a>
        <a
          href="/manage-links.html"
          className="transition-colors hover:text-brand-purple"
        >
          DIY 自定义导航
        </a>
      </div>
    </aside>
  )
}

export default CategorySidebar
