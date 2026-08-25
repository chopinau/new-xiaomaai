export const runtime = 'edge';

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, BookOpen, Eye, Calendar, Tag, ChevronRight, ExternalLink, Sparkles } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { manuals } from '@/data/manuals'
import { tools as allTools } from '@/data/tools'


interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ManualDetailPage({ params }: PageProps) {
  const { slug } = await params
  const meta = manuals.find((m) => m.slug === slug)

  if (!meta) {
    notFound()
  }

  // 读 md 文件
  const filePath = path.join(process.cwd(), 'data', 'manuals', `${slug}.md`)
  let content = ''
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const { content: mdContent } = matter(raw)
    content = mdContent
  } catch {
    content = '*手册内容待补充*'
  }

  // 相关工具
  const relatedTools = allTools
    .filter((t) => meta.relatedTools.includes(t.slug))
    .slice(0, 4)

  // 在线使用入口:支持站内 slug 或完整 https:// 链接
  const toolIsExternal = !!meta.toolUrl && /^https?:\/\//.test(meta.toolUrl)
  const toolHref = meta.toolUrl
    ? toolIsExternal
      ? meta.toolUrl
      : `/tools/${meta.toolUrl}`
    : null

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回 + 面包屑 */}
        <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/manuals" className="hover:text-brand-purple">操作手册</Link>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="text-foreground">{meta.category}</span>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground line-clamp-1">{meta.title}</span>
        </div>

        {/* Hero 卡片 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="relative h-40 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 sm:h-52">
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="size-16 text-emerald-600/30" />
            </div>
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-600 backdrop-blur-sm">
              {meta.category}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {meta.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{meta.excerpt}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>更新于 {meta.updatedAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                <span>{meta.views.toLocaleString()} 阅读</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>作者：{meta.author}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                  <Tag className="mr-1 inline size-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* 在线使用入口(P1: 立即跳到工具) */}
            {toolHref && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <Sparkles className="size-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-emerald-700">学完即用</div>
                  <div className="text-[11px] text-emerald-600/80">直接打开工具开始练习</div>
                </div>
                <a
                  href={toolHref}
                  {...(toolIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                >
                  {meta.toolCta || '立即使用'}
                  {toolIsExternal && <ExternalLink className="size-3.5" />}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Markdown 内容 */}
        <article className="prose prose-sm mt-8 max-w-none rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 prose-headings:font-bold prose-headings:text-foreground prose-h1:text-2xl prose-h2:mt-8 prose-h2:text-xl prose-h3:mt-6 prose-h3:text-base prose-p:my-3 prose-p:leading-relaxed prose-p:text-muted-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-brand-purple prose-pre:bg-foreground prose-pre:text-white prose-strong:text-foreground prose-li:text-muted-foreground prose-a:text-brand-purple prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>

        {/* 相关工具 */}
        {relatedTools.length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <BookOpen className="size-4 text-brand-purple" />
              相关工具
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-brand-purple/30 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-bold text-brand-purple">
                    {tool.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-brand-purple">
                      {tool.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/manuals"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-purple"
          >
            <ArrowLeft className="size-4" />
            返回操作手册列表
          </Link>
        </div>

        <div className="h-12" />
      </main>

      <SiteFooter />
    </div>
  )
}
