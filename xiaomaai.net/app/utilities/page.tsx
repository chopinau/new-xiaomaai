'use client'

import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const utilities = [
  { name: '抠图去背景', href: '/remover', desc: 'AI 一键去除图片背景', icon: '🧹' },
  { name: 'PDF 工具', href: '/pdf', desc: 'PDF 转图片、合并、拆分', icon: '📄' },
  { name: 'PPT 工具', href: '/pptx', desc: 'PPT 转图片、提取素材', icon: '📊' },
  { name: 'PSD 工具', href: '/psd', desc: 'PSD 文件预览与导出', icon: '🎨' },
  { name: 'GIF 工具', href: '/gif', desc: '视频转 GIF、GIF 编辑', icon: '🖼️' },
  { name: '图片分割', href: '/fenge', desc: '图片九宫格/多格分割', icon: '✂️' },
  { name: 'AI 画布', href: '/canvas', desc: '在线 AI 创作画布', icon: '🎯' },
  { name: '工作流', href: '/workflows', desc: 'AI 工作流模板库', icon: '⚡' },
  { name: '提示词库', href: '/prompts', desc: '高质量提示词模板', icon: '💬' },
  { name: '视频编辑', href: '/canvas-assets/video-studio', desc: '在线视频编辑工具', icon: '🎬' },
]

export default function UtilitiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">实用工具</h1>
          <p className="mt-2 text-sm text-muted-foreground">小马 AI 提供的在线实用工具集，全部免费、无需登录</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {utilities.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple/8 text-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/12">
                {tool.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand-purple">
                  {tool.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-purple" />
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}