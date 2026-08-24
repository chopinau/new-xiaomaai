import type { Metadata } from 'next'
import { TopNav } from '@/components/TopNav'

export const metadata: Metadata = {
  title: '工具对比',
  description: '对比 AI 工具的功能、价格、评分，帮你找到最合适的工具',
  openGraph: {
    title: 'AI 工具对比 | 小马 AI',
    description: '对比 AI 工具的功能、价格、评分，帮你找到最合适的工具',
    type: 'website',
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <TopNav />
      <main>{children}</main>
    </div>
  )
}