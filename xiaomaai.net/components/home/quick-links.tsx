'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Palette, Workflow, BookOpen, FileCode, Key, Gauge } from 'lucide-react'

const links = [
  { label: 'AI 画布', icon: Palette, gradient: 'from-brand-purple to-brand-glow' },
  { label: '工作流', icon: Workflow, gradient: 'from-brand-blue to-cyan-300' },
  { label: '提示词库', icon: BookOpen, gradient: 'from-brand-pink to-rose-300' },
  { label: '客户端', icon: FileCode, gradient: 'from-brand-purple to-brand-blue' },
  { label: 'API 教程', icon: Key, gradient: 'from-brand-blue to-blue-400' },
  { label: '管理后台', icon: Gauge, gradient: 'from-brand-pink to-orange-300' },
]

export function QuickLinks() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {links.map((item) => (
        <Link
          key={item.label}
          href={
            item.label === 'AI 画布'
              ? '/canvas'
              : item.label === '工作流'
              ? '/flow'
              : item.label === '提示词库'
              ? '/prompts'
              : item.label === '客户端'
              ? '/codex'
              : item.label === 'API 教程'
              ? '/articles'
              : '/admin'
          }
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-2 py-3.5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-card-hover"
        >
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110',
              item.gradient
            )}
          >
            <item.icon className="size-5" />
          </div>
          <span className="text-xs font-medium text-foreground group-hover:text-brand">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
