import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tag as TagIcon, Sparkles } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { tools as allTools } from '@/data/tools'
import { ToolCard } from '@/components/ModelCard'
import { manuals } from '@/data/manuals'

interface PageProps {
  params: Promise<{ tag: string }>
}

// URL 段 ↔ tag: 大小写敏感,先尝试原始,再尝试小写
function findToolsByTag(tag: string) {
  const decoded = decodeURIComponent(tag)
  const matched = allTools.filter((t) =>
    t.tags?.some((tg) => tg === decoded || tg.toLowerCase() === decoded.toLowerCase())
  )
  return { matched, displayTag: matched[0]?.tags.find((tg) => tg.toLowerCase() === decoded.toLowerCase()) ?? decoded }
}

export async function generateStaticParams() {
  const tagSet = new Set<string>()
  allTools.forEach((t) => t.tags?.forEach((tg) => tagSet.add(tg)))
  return Array.from(tagSet).map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params
  const { matched, displayTag } = findToolsByTag(tag)
  if (matched.length === 0) return { title: '标签未找到' }
  return {
    title: `#${displayTag} 相关 AI 工具 (${matched.length} 个) | 小马AI`,
    description: `收录 ${matched.length} 个与「${displayTag}」标签相关的 AI 工具,涵盖分类、定价、官方入口。`,
  }
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params
  const { matched, displayTag } = findToolsByTag(tag)
  if (matched.length === 0) notFound()

  // 同时筛相关手册:匹配 tags 或 relatedTools 含当前 tag 关联的工具
  const relatedManuals = manuals
    .filter((m) => {
      if (m.tags?.some((tg) => tg.toLowerCase() === displayTag.toLowerCase())) return true
      const toolSlugs = new Set(matched.map((t) => t.slug))
      return m.relatedTools?.some((s) => toolSlugs.has(s))
    })
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回 + 面包屑 */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/tools" className="hover:text-brand-purple">工具市场</Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">#{displayTag}</span>
        </div>

        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-purple/[0.05] via-brand-blue/[0.04] to-background p-6 shadow-card sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue shadow-hero">
              <TagIcon className="size-7 text-white" />
            </div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand-purple shadow-sm">
              <Sparkles className="size-3" />
              AI 工具专题
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              #{displayTag}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              收录 {matched.length} 个与「{displayTag}」相关的 AI 工具
              {relatedManuals.length > 0 && `,以及 ${relatedManuals.length} 篇实战教程`}
            </p>
          </div>
        </section>

        {/* 工具卡片网格 */}
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-foreground">相关 AI 工具</h2>
          {matched.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {matched.map((tool, idx) => (
                <ToolCard key={tool.id} tool={tool} index={idx} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              该标签下暂无工具
            </div>
          )}
        </section>

        {/* 相关手册(若有) */}
        {relatedManuals.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="size-4 text-emerald-600" />
              相关操作手册
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {relatedManuals.map((m) => (
                <Link
                  key={m.slug}
                  href={`/manuals/${m.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-card-hover"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    {m.category}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-emerald-600">
                    {m.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-purple"
          >
            <ArrowLeft className="size-4" />
            返回工具市场
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
