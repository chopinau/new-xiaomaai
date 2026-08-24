'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Film } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { PromptItem } from '@/data/prompts'

// 视频提示词只保留共享字段(无 imageUrl)
export interface VideoPromptLike {
  id: number
  category: string
  style?: string
  title: string
  description?: string
  prompt: string
  source?: string
  sourceUrl?: string
  author?: string
  authorUrl?: string
}

interface PromptCardProps {
  prompt: PromptItem | VideoPromptLike
  index?: number
}

export function PromptCard({ prompt, index = 0 }: PromptCardProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      setCopied(true)
      toast({
        variant: 'success',
        title: '已复制',
        description: '提示词已复制到剪贴板',
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: '复制失败',
        description: '请手动复制提示词内容',
      })
    })
  }

  const isImage = 'imageUrl' in prompt && !!prompt.imageUrl
  const description = 'description' in prompt ? prompt.description : undefined
  const preview = prompt.prompt.slice(0, 120).replace(/\n/g, ' ')

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
        {/* 示例图片（仅图像提示词） */}
        {isImage && (
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(prompt as PromptItem).imageUrl}
              alt={prompt.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              示例图
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          {/* 分类标签 */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-purple">
              {prompt.category}
            </span>
            {prompt.style && prompt.style !== 'Featured' && prompt.style !== '精选' && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {prompt.style}
              </span>
            )}
          </div>

          {/* 标题 */}
          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold text-card-foreground transition-colors group-hover:text-brand-purple">
            {prompt.title}
          </h3>

          {/* 内容方向（视频提示词） */}
          {description && (
            <p className="mb-2 flex items-start gap-1 text-xs leading-relaxed text-ink-600">
              <Film className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-purple/70" />
              <span>{description}</span>
            </p>
          )}

          {/* 提示词预览 */}
          <p className="mb-3 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
            {preview}
          </p>

          {/* 作者归属 + 操作栏 */}
          <div className="mt-auto border-t border-border pt-2.5">
            {prompt.author && (
              <div className="mb-2 flex items-center justify-between">
                <span className="truncate text-[10px] text-muted-foreground">
                  来自{' '}
                  {prompt.authorUrl ? (
                    <a
                      href={prompt.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex max-w-[150px] items-center gap-0.5 truncate align-baseline font-medium text-brand-purple hover:underline"
                    >
                      {prompt.author}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-medium text-ink-600">{prompt.author}</span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                #{prompt.id}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  copied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-brand-purple/20 bg-brand-purple/5 text-brand-purple hover:border-brand-purple hover:bg-brand-purple/10'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
