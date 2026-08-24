'use client'

import { useRouter } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import type { Collection } from '@/data/collections'

interface CollectionCardProps {
  collection: Collection
  index?: number
}

export function CollectionCard({ collection, index = 0 }: CollectionCardProps) {
  const router = useRouter()

  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[collection.icon]
  const Icon = IconComponent || LucideIcons.Folder

  function handleClick() {
    router.push(`/collections/${collection.slug}`)
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
      className="animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="group relative flex h-full flex-col rounded-xl border border-ink-200 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:bg-gradient-to-br hover:from-brand-purple/5 hover:to-brand-blue/5">
        {/* 图标 */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient shadow-hero transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* 标题 */}
        <h3 className="mb-2 text-base font-semibold text-foreground transition-colors group-hover:text-brand-purple">
          {collection.title}
        </h3>

        {/* 描述 */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {collection.description}
        </p>

        {/* 工具数量徽章 */}
        <div className="mt-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-xs font-medium text-brand-purple">
            {collection.toolSlugs.length} 个工具
          </span>
          <span className="text-xs text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            查看合集 →
          </span>
        </div>
      </div>
    </div>
  )
}