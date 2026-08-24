import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://xiaomaai.net'),
  title: {
    default: '小马 AI 工具中心 | XIAOMAAI.NET - 全球 AI 工具聚合市场',
    template: '%s | 小马 AI',
  },
  description: '聚合 440+ 全球 AI 工具，对话、图像、视频、音频、编程、效率全覆盖。支持一键访问与 API 配置教程。',
  keywords: ['AI 工具', 'AI 工具市场', 'ChatGPT', 'Claude', 'Midjourney', '小马 AI', 'AI 画布'],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: '小马 AI 工具中心',
    description: '440+ 全球 AI 工具聚合市场',
    type: 'website',
    locale: 'zh_CN',
    siteName: '小马 AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: '小马 AI 工具中心',
    description: '440+ 全球 AI 工具聚合市场',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': '/api/rss',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white font-sans text-ink-900 antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
