'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/TopNav'
import { SiteFooter } from '@/components/site-footer'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { modelPricing, type ModelPricing } from '@/data/modelPricing'

// 厂商分类映射
const VENDOR_MAP: Record<string, { name: string; color: string }> = {
  'gpt-':       { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'o1':         { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'o3':         { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'o4':         { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'dall-e':     { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'sora':       { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'gpt-image':  { name: 'OpenAI',           color: 'bg-emerald-100 text-emerald-800' },
  'claude':     { name: 'Anthropic',        color: 'bg-orange-100 text-orange-800' },
  'gemini':     { name: 'Google',           color: 'bg-blue-100 text-blue-800' },
  'deepseek':   { name: 'DeepSeek',         color: 'bg-indigo-100 text-indigo-800' },
  'grok':       { name: 'xAI',              color: 'bg-gray-100 text-gray-800' },
  'llama':      { name: 'Meta',             color: 'bg-sky-100 text-sky-800' },
  'mistral':    { name: 'Mistral',          color: 'bg-amber-100 text-amber-800' },
  'codestral':  { name: 'Mistral',          color: 'bg-amber-100 text-amber-800' },
  'qwen':       { name: '阿里',              color: 'bg-rose-100 text-rose-800' },
  'ernie':      { name: '百度',              color: 'bg-red-100 text-red-800' },
  'hunyuan':    { name: '腾讯',              color: 'bg-teal-100 text-teal-800' },
  'glm':        { name: '智谱',              color: 'bg-violet-100 text-violet-800' },
  'kimi':       { name: '月之暗面',           color: 'bg-pink-100 text-pink-800' },
  'midjourney': { name: 'Midjourney',       color: 'bg-purple-100 text-purple-800' },
  'runway':     { name: 'Runway',           color: 'bg-cyan-100 text-cyan-800' },
  'pika':       { name: 'Pika',             color: 'bg-yellow-100 text-yellow-800' },
  'elevenlabs': { name: 'ElevenLabs',       color: 'bg-lime-100 text-lime-800' },
  'suno':       { name: 'Suno',             color: 'bg-fuchsia-100 text-fuchsia-800' },
  'stability':  { name: 'Stability AI',     color: 'bg-slate-100 text-slate-800' },
  'leonardo':   { name: 'Leonardo',         color: 'bg-stone-100 text-stone-800' },
  'synthesia':  { name: 'Synthesia',        color: 'bg-zinc-100 text-zinc-800' },
  'heygen':     { name: 'HeyGen',           color: 'bg-neutral-100 text-neutral-800' },
  'murf':       { name: 'Murf',             color: 'bg-green-100 text-green-800' },
  'play-ht':    { name: 'Play.ht',          color: 'bg-blue-100 text-blue-800' },
  'speechify':  { name: 'Speechify',        color: 'bg-red-100 text-red-800' },
}

function getVendor(slug: string): { name: string; color: string } {
  for (const [prefix, vendor] of Object.entries(VENDOR_MAP)) {
    if (slug.startsWith(prefix)) return vendor
  }
  return { name: '其他', color: 'bg-gray-100 text-gray-800' }
}

const ALL_VENDORS = [
  'OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'xAI', 'Meta', 'Mistral',
  '阿里', '百度', '腾讯', '智谱', '月之暗面',
  'Midjourney', 'Runway', 'Pika', 'ElevenLabs', 'Suno',
  'Stability AI', 'Leonardo', 'Synthesia', 'HeyGen', 'Murf', 'Play.ht', 'Speechify',
]

type SortField = 'name' | 'vendor' | 'inputYuan' | 'outputYuan' | 'cachedInputYuan' | 'cachedOutputYuan' | 'contextWindow'

export default function PricingPage() {
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('all')
  const [sortField, setSortField] = useState<SortField>('inputYuan')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const models = useMemo(() => {
    const entries = Object.entries(modelPricing) as [string, ModelPricing][]
    let result = entries.map(([slug, p]) => ({
      ...p,
      vendor: getVendor(slug),
    }))

    // 搜索过滤
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.slug.toLowerCase().includes(q) ||
        m.vendor.name.toLowerCase().includes(q) ||
        (m.note && m.note.toLowerCase().includes(q))
      )
    }

    // 厂商筛选
    if (selectedVendor !== 'all') {
      result = result.filter(m => m.vendor.name === selectedVendor)
    }

    // 排序
    result.sort((a, b) => {
      let valA: number | string = 0
      let valB: number | string = 0

      switch (sortField) {
        case 'name':
          valA = a.slug; valB = b.slug
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        case 'vendor':
          valA = a.vendor.name; valB = b.vendor.name
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        case 'inputYuan':
          valA = a.inputYuan; valB = b.inputYuan
          break
        case 'outputYuan':
          valA = a.outputYuan; valB = b.outputYuan
          break
        case 'cachedInputYuan':
          valA = a.cachedInputYuan ?? -1; valB = b.cachedInputYuan ?? -1
          break
        case 'cachedOutputYuan':
          valA = a.cachedOutputYuan ?? -1; valB = b.cachedOutputYuan ?? -1
          break
        case 'contextWindow':
          valA = a.contextWindow ?? 0; valB = b.contextWindow ?? 0
          break
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })

    return result
  }, [search, selectedVendor, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3 text-brand-purple" />
      : <ArrowDown className="ml-1 inline h-3 w-3 text-brand-purple" />
  }

  const formatPrice = (yuan: number): string => {
    if (yuan === 0) return '免费'
    if (yuan < 1) return `¥${yuan.toFixed(2)}`
    if (yuan < 10) return `¥${yuan.toFixed(1)}`
    return `¥${yuan.toFixed(0)}`
  }

  const formatCachePrice = (yuan: number | undefined): string => {
    if (yuan === undefined) return '-'
    return formatPrice(yuan)
  }

  const formatContext = (ctx: number | undefined): string => {
    if (!ctx) return '-'
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(1)}M`
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}K`
    return ctx.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className="text-gradient-brand">模型价格</span>对比
          </h1>
          <p className="mt-3 text-muted-foreground">
            实时对比各大 AI 厂商模型的 token 价格，助你做出最优选择
          </p>
        </div>

        {/* 控制栏 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 搜索 */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索模型名称..."
              className="h-10 border-border bg-card pl-9 text-sm focus-visible:ring-brand-purple"
            />
          </div>

          {/* 厂商筛选 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedVendor('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedVendor === 'all'
                  ? 'bg-brand-purple text-white'
                  : 'bg-card border border-border text-muted-foreground hover:border-brand-purple/50 hover:text-foreground'
              }`}
            >
              全部 ({Object.keys(modelPricing).length})
            </button>
            {ALL_VENDORS.filter(v => models.some(m => m.vendor.name === v) || selectedVendor === 'all').map(vendor => {
              const count = Object.values(modelPricing).filter(m => getVendor(m.slug).name === vendor).length
              if (count === 0) return null
              return (
                <button
                  key={vendor}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selectedVendor === vendor
                      ? 'bg-brand-purple text-white'
                      : 'bg-card border border-border text-muted-foreground hover:border-brand-purple/50 hover:text-foreground'
                  }`}
                >
                  {vendor} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    模型名称 <SortIcon field="name" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('vendor')}
                  >
                    厂商 <SortIcon field="vendor" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('inputYuan')}
                  >
                    输入价格 <span className="font-normal lowercase">(¥/M tokens)</span> <SortIcon field="inputYuan" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('outputYuan')}
                  >
                    输出价格 <span className="font-normal lowercase">(¥/M tokens)</span> <SortIcon field="outputYuan" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('cachedInputYuan')}
                  >
                    缓存读 <SortIcon field="cachedInputYuan" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('cachedOutputYuan')}
                  >
                    缓存写 <SortIcon field="cachedOutputYuan" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('contextWindow')}
                  >
                    上下文窗口 <SortIcon field="contextWindow" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {models.map((model) => (
                  <tr
                    key={model.slug}
                    className="transition-colors hover:bg-brand-purple/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {model.slug}
                        </span>
                        {model.note && (
                          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                            {model.note}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[11px] font-medium ${model.vendor.color}`}>
                        {model.vendor.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={model.inputYuan === 0 ? 'text-emerald-600 font-semibold' : 'text-foreground'}>
                        {formatPrice(model.inputYuan)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={model.outputYuan === 0 ? 'text-emerald-600 font-semibold' : 'text-foreground'}>
                        {formatPrice(model.outputYuan)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatCachePrice(model.cachedInputYuan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatCachePrice(model.cachedOutputYuan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatContext(model.contextWindow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {models.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg">未找到匹配的模型</p>
              <p className="mt-1 text-sm">尝试调整搜索条件或筛选器</p>
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">数据说明</p>
          <p className="mt-1">
            数据来源：LiteLLM + OpenRouter，同步时间：2026-07-06，USD→CNY 汇率：7.2。
            价格为参考值，实际以各厂商官网为准。
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}