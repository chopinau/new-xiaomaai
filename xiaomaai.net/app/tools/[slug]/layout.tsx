import { tools } from '@/data/tools'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tool = tools.find(t => t.slug === slug)

  if (!tool) {
    return {
      title: '工具未找到 | 小马AI导航',
      description: '未找到对应的 AI 工具，请返回工具列表查看。',
    }
  }

  const title = `${tool.name} - ${tool.description.slice(0, 30)} | 小马AI导航`
  const description = tool.description.slice(0, 160)
  const keywords = [...tool.tags, tool.name, 'AI工具', tool.category]
  const images = tool.logoUrl ? [tool.logoUrl] : ['/og-image.png']

  return {
    title: { absolute: title },
    description,
    keywords,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      title,
      description,
      images,
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
  }
}

export default async function ToolDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tool = tools.find(t => t.slug === slug)

  // SoftwareApplication JSON-LD：服务端注入，随 SSR 输出
  const jsonLd = tool
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        url: tool.url,
        image: tool.logoUrl,
        applicationCategory: tool.category,
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY',
        },
        ...(tool.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: tool.rating,
                bestRating: 5,
                worstRating: 1,
                ratingCount: tool.views || 1,
              },
            }
          : {}),
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
