'use client'

import { TopNav } from '@/components/TopNav'
import Link from 'next/link'

/**
 * 302.ai 风格统一布局
 * - 白色顶栏 (TopNav)
 * - 内容区
 * - 极简 Footer
 * - 适用于所有面向 C 端的页面
 */
export function MarketLayout({
  children,
  showFooter = true,
}: {
  children: React.ReactNode
  showFooter?: boolean
}) {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <TopNav />
      <main className="flex-1">{children}</main>
      {showFooter && (
        <footer className="border-t border-ink-100 bg-white py-6">
          <div className="container mx-auto px-4 text-center text-[11px] text-ink-400">
            <p>© 2026 小马科技 XIAOMAAI.NET</p>
            <p className="mt-1.5 flex items-center justify-center gap-3">
              <span>Powered by Next.js · shadcn/ui</span>
              <span>·</span>
              <Link href="/admin" className="transition hover:text-ink-700 hover:underline">
                管理后台
              </Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
