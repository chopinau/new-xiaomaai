import type { Metadata } from 'next'
import { getArticleBySlug, type Article } from '@/data/articles'

const SITE_URL = 'https://xiaomaai.net'

/** 生成 description：优先 excerpt，否则截取正文前 120 字（去掉 markdown 符号） */
function buildDescription(article: Article): string {
  const excerpt = (article.excerpt || '').trim()
  if (excerpt) {
    return excerpt.length > 160 ? `${excerpt.slice(0, 160)}…` : excerpt
  }
  const plain = article.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*`>|\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {
      title: '文章未找到',
      description: '未找到对应的文章，请返回资讯教程中心查看。',
    }
  }

  const title = `${article.title} - 小马 AI`
  const description = buildDescription(article)
  const images = article.coverUrl ? [article.coverUrl] : ['/og-image.png']

  return {
    title: { absolute: title },
    description,
    keywords: [...article.tags, article.category, 'AI 工具', '小马 AI'],
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/articles/${article.slug}`,
      type: 'article',
      images,
      siteName: '小马 AI',
      locale: 'zh_CN',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
  }
}

export default async function ArticleDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        image: article.coverUrl ? [article.coverUrl] : undefined,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: { '@type': 'Person', name: article.author },
        publisher: {
          '@type': 'Organization',
          name: '小马 AI',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/articles/${article.slug}` },
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
