'use client'

import Link from 'next/link'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Zap, Layers, Coins, Gauge, ExternalLink, Check } from 'lucide-react'
import { modelPricing } from '@/data/modelPricing'

const ADVANTAGES = [
  {
    icon: Layers,
    title: '统一接口',
    desc: '一套 API 接入所有主流大模型，无需逐个对接各家厂商，大幅降低集成成本。',
  },
  {
    icon: Coins,
    title: '按量计费',
    desc: '只为你实际使用的 token 付费，无最低消费，无隐藏费用，随时充值随时用。',
  },
  {
    icon: Zap,
    title: '多模型支持',
    desc: '覆盖 OpenAI、Anthropic、Google、DeepSeek、xAI 等 20+ 厂商，50+ 模型。',
  },
  {
    icon: Gauge,
    title: '低延迟',
    desc: '全球多节点部署，智能路由，确保 API 请求毫秒级响应，生产级稳定性。',
  },
]

// 精选模型展示
const FEATURED_MODELS = [
  { slug: 'gpt-5', vendor: 'OpenAI' },
  { slug: 'claude-sonnet-5', vendor: 'Anthropic' },
  { slug: 'gemini-3.1-pro', vendor: 'Google' },
  { slug: 'deepseek-v3.2', vendor: 'DeepSeek' },
  { slug: 'grok-4', vendor: 'xAI' },
  { slug: 'llama-4', vendor: 'Meta' },
  { slug: 'glm-5', vendor: '智谱' },
  { slug: 'kimi-k2', vendor: '月之暗面' },
]

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-deep opacity-95" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-purple/30 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/20 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-brand-pink/15 blur-[80px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-6 gap-1.5 border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                OpenAPI 代理服务
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                小马 AI <span className="text-gradient-brand">OpenAPI</span> 代理
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/75 md:text-xl">
                一键接入大模型 API，按量付费，无需自行对接各家厂商。
                统一的接口格式，轻松切换模型，专注你的业务逻辑。
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  asChild
                  className="gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-brand-deep shadow-lg hover:bg-white/90"
                >
                  <a href="https://api.xiaomaai.net" target="_blank" rel="noopener noreferrer">
                    开始接入 <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 rounded-full border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-white backdrop-blur-sm hover:bg-white/10"
                >
                  <Link href="/pricing">
                    查看价格 <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 优势 */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              为什么选择 <span className="text-gradient-brand">小马 AI OpenAPI</span>？
            </h2>
            <p className="mt-3 text-muted-foreground">
              我们提供企业级 API 代理服务，让你专注于创造价值
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANTAGES.map((adv) => (
              <Card key={adv.title} className="card-brand border-border">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10">
                    <adv.icon className="h-6 w-6 text-brand-purple" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{adv.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{adv.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 功能特性 */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              '兼容 OpenAI SDK 格式',
              '支持流式输出 (SSE)',
              '自动故障转移',
              '请求速率限制',
              '用量统计面板',
              'API Key 管理',
              'Webhook 回调',
              '多语言 SDK',
              '7×24 技术支持',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 支持的模型 */}
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                支持的<span className="text-gradient-brand">模型</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                覆盖 {Object.keys(modelPricing).length}+ 模型，持续更新中
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_MODELS.map((m) => {
                const pricing = modelPricing[m.slug]
                return (
                  <Card key={m.slug} className="card-brand border-border">
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                          {m.vendor}
                        </Badge>
                      </div>
                      <h3 className="font-mono text-sm font-semibold">{m.slug}</h3>
                      {pricing && (
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>输入</span>
                            <span className="font-mono text-foreground">
                              {pricing.inputYuan === 0 ? '免费' : `¥${pricing.inputYuan}/M`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>输出</span>
                            <span className="font-mono text-foreground">
                              {pricing.outputYuan === 0 ? '免费' : `¥${pricing.outputYuan}/M`}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <Button asChild variant="outline" className="border-brand-purple text-brand-purple hover:bg-brand-purple/5">
                <Link href="/pricing">
                  查看完整价格表 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 快速开始 */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              快速<span className="text-gradient-brand">开始</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              三步接入，即刻使用
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: '获取 API Key',
                desc: '在小马 AI 平台获取 API Key，快速接入。',
              },
              {
                step: '02',
                title: '选择模型',
                desc: '在价格页面对比模型，选择最适合你的模型。',
              },
              {
                step: '03',
                title: '开始调用',
                desc: '使用标准 OpenAI SDK 格式调用 API，即刻接入。',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple/10">
                  <span className="text-2xl font-bold text-brand-purple">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              asChild
              className="gap-2 rounded-full gradient-brand px-8 py-3 text-base font-semibold text-white shadow-lg hover:brightness-110"
            >
              <a href="https://api.xiaomaai.net" target="_blank" rel="noopener noreferrer">
                立即接入 OpenAPI <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}