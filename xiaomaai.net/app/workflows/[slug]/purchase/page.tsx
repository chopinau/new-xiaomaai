import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Copy, MessageCircle, CheckCircle2, Smartphone } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { workflows } from '@/data/workflows'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WorkflowPurchasePage({ params }: PageProps) {
  const { slug } = await params
  const workflow = workflows.find((w) => w.slug === slug)

  if (!workflow) {
    notFound()
  }

  const w = workflow

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/workflows/${w.slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-purple"
        >
          <ArrowLeft className="size-4" />
          返回工作流详情
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {/* 顶部标题区 */}
          <div className="border-b border-border bg-gradient-to-br from-brand-purple/5 via-brand-blue/5 to-brand-pink/5 px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-md">
              <Smartphone className="size-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              购买「{w.name}」
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              请使用微信/支付宝扫描下方二维码,付款后联系作者获取模板
            </p>
          </div>

          {/* 订单信息 */}
          <div className="border-b border-border p-6">
            <h2 className="text-sm font-semibold text-foreground">订单信息</h2>
            <div className="mt-3 space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品名称</span>
                <span className="font-medium text-foreground">{w.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">价格</span>
                <span className="font-bold text-brand-purple">{w.price}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">实付</span>
                <span className="text-lg font-bold text-brand-purple">{w.price}</span>
              </div>
            </div>
          </div>

          {/* 收款二维码 */}
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            {/* 微信 */}
            <div className="text-center">
              <div className="mb-2 text-sm font-semibold text-foreground">微信支付</div>
              <div className="mx-auto aspect-square w-48 overflow-hidden rounded-xl border-2 border-emerald-100 bg-emerald-50/30 p-3">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-white text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="text-3xl">💚</div>
                    <div className="mt-2">微信收款码</div>
                    <div className="mt-1 text-[10px]">请上传到 public/qrcodes/wechat.png</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">打开微信扫一扫</div>
            </div>

            {/* 支付宝 */}
            <div className="text-center">
              <div className="mb-2 text-sm font-semibold text-foreground">支付宝</div>
              <div className="mx-auto aspect-square w-48 overflow-hidden rounded-xl border-2 border-blue-100 bg-blue-50/30 p-3">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-white text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="text-3xl">💙</div>
                    <div className="mt-2">支付宝收款码</div>
                    <div className="mt-1 text-[10px]">请上传到 public/qrcodes/alipay.png</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">打开支付宝扫一扫</div>
            </div>
          </div>

          {/* 流程说明 */}
          <div className="border-t border-border bg-muted/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">购买流程</h2>
            <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white">1</span>
                <span>扫描上方二维码,支付 <span className="font-semibold text-brand-purple">{w.price}</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white">2</span>
                <span>添加作者微信,备注「{w.name}」</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white">3</span>
                <span>作者 5 分钟内发送模板链接和使用文档</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-semibold text-white">4</span>
                <span>邀请你进入专属微信群,获得 1v1 部署支持</span>
              </li>
            </ol>
          </div>

          {/* 联系方式 */}
          <div className="border-t border-border p-6">
            <h2 className="text-sm font-semibold text-foreground">联系作者</h2>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-purple/20 bg-brand-purple/5 p-4">
              <div>
                <div className="text-xs text-muted-foreground">作者微信号</div>
                <div className="mt-1 font-mono text-base font-semibold text-foreground">
                  xiaoma-ai-bot
                </div>
              </div>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl bg-brand-purple text-white hover:bg-brand-deep"
              >
                <Copy className="size-3.5" />
                复制
              </Button>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-3 w-full gap-2 rounded-xl border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5 hover:border-brand-purple"
            >
              <a href="https://work.weixin.qq.com/" target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                在线咨询
              </a>
            </Button>
          </div>

          {/* 保障 */}
          <div className="border-t border-border bg-muted/30 p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              7 天无理由退款 · 永久免费更新 · 1v1 部署支持
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
