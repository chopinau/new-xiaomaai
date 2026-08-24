import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, ShoppingCart, MessageCircle, Star, Users, Tag, Zap, DollarSign } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { workflows } from '@/data/workflows'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { slug } = await params
  const workflow = workflows.find((w) => w.slug === slug)

  if (!workflow) {
    notFound()
  }

  const w = workflow
  const discount = w.originalPrice
    ? Math.round((1 - parseFloat(w.price.replace('¥', '')) / parseFloat(w.originalPrice.replace('¥', ''))) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 返回 + 面包屑 */}
        <Link
          href="/workflows"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-purple"
        >
          <ArrowLeft className="size-4" />
          返回工作流市场
        </Link>

        {/* 顶部封面区 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="relative h-48 bg-gradient-to-br from-brand-purple/20 via-brand-blue/15 to-brand-pink/20 sm:h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl opacity-30">🧩</div>
            </div>
            <div className="absolute right-4 top-4 flex gap-2">
              <Badge className="bg-card/90 text-foreground backdrop-blur-sm">{w.category}</Badge>
              {discount > 0 && (
                <Badge className="bg-red-500 text-white">-{discount}%</Badge>
              )}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {w.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{w.description}</p>

            {/* 元数据行 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{w.rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                <span>{w.sales} 人在用</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="size-3.5" />
                <span>作者：{w.author}</span>
              </div>
            </div>

            {/* 价格 + 操作 */}
            <div className="mt-6 flex flex-col items-stretch gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-brand-purple">{w.price}</span>
                {w.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">{w.originalPrice}</span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-xl bg-brand-purple px-6 text-white shadow-sm transition-all hover:bg-brand-deep hover:shadow-md"
                >
                  <a href={w.externalUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    使用此模板
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-xl border-brand-purple/30 px-6 text-brand-purple transition-all hover:bg-brand-purple/5 hover:border-brand-purple"
                >
                  <Link href={`/workflows/${w.slug}/purchase`}>
                    <ShoppingCart className="size-4" />
                    立即购买
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 详情 + 侧边栏 */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 左侧：核心信息 */}
          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Zap className="size-4 text-brand-purple" />
                适用场景
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {w.description} 适用于个人和团队,开箱即用,无需编程基础。
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <DollarSign className="size-4 text-brand-purple" />
                费用估算
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[11px] text-muted-foreground">每次费用</div>
                  <div className="mt-1 font-mono text-base font-semibold text-foreground">
                    {w.estimatedCost}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[11px] text-muted-foreground">所需模型</div>
                  <div className="mt-1 text-xs font-medium text-foreground">
                    {w.models?.join(' / ')}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[11px] text-muted-foreground">部署难度</div>
                  <div className="mt-1 text-xs font-medium text-emerald-600">⭐ 简单</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold text-foreground">标签</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {w.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧：定制咨询 */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 p-6 shadow-card">
              <h3 className="text-sm font-semibold text-foreground">需要定制?</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                我们提供一对一定制服务,根据你的具体业务场景调整工作流
              </p>
              <Button
                asChild
                size="sm"
                className="mt-3 w-full gap-2 rounded-xl bg-brand-purple text-white hover:bg-brand-deep"
              >
                <a href="https://work.weixin.qq.com/" target="_blank" rel="noreferrer">
                  <MessageCircle className="size-3.5" />
                  联系作者定制
                </a>
              </Button>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-sm font-semibold text-foreground">购买保障</h3>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  7 天无理由退款
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  永久免费更新
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  微信群 1v1 支持
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  完整使用文档
                </li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="h-12" />
      </main>

      <SiteFooter />
    </div>
  )
}
