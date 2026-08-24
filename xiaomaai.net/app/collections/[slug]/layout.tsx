import type { Metadata } from 'next'
import { getCollectionBySlug } from '@/data/collections'
import { tools } from '@/data/tools'
import type { Tool } from '@/data/tools'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)

  if (!collection) {
    return {
      title: '专题合集',
      description: '小马 AI 精选 AI 工具专题合集，按场景分类，快速找到你需要的工具组合。',
    }
  }

  // 站点名由根布局 title.template（%s | 小马 AI）自动追加
  const title = `${collection.title} - 专题合集`
  const description = (collection.introContent || collection.description).slice(0, 120)
  const keywords = collection.keywords?.length
    ? [...collection.keywords, 'AI工具', '专题合集']
    : ['AI工具', '专题合集']
  const images = collection.coverImage ? [collection.coverImage] : ['/og-image.png']

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/collections/${collection.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/collections/${collection.slug}`,
      images,
      siteName: '小马 AI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

export default async function CollectionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)

  // 服务端注入 ItemList JSON-LD（随 SSR HTML 输出，利于 SEO）
  let jsonLd: Record<string, unknown> | null = null
  if (collection) {
    const sections =
      collection.sections && collection.sections.length > 0
        ? collection.sections
        : [{ title: collection.title, desc: collection.description, toolSlugs: collection.toolSlugs }]
    const itemSlugs = Array.from(new Set(sections.flatMap((s) => s.toolSlugs)))
    const items = itemSlugs
      .map((s) => tools.find((t) => t.slug === s))
      .filter((t): t is Tool => Boolean(t))

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: collection.title,
      description: collection.introContent || collection.description,
      url: `/collections/${collection.slug}`,
      numberOfItems: items.length,
      itemListElement: items.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        url: `/tools/${t.slug}`,
        description: t.description.slice(0, 100),
      })),
    }
  }

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
