// 资讯 / 教程文章
// ⚠️ 禁止手动编写：所有文章必须来自 RSS 抓取或 news-draft.ts 审核发布
// 数据来源: scripts/fetch-news.mjs → data/news-draft.ts → /admin/news 审核 → 发布
export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverUrl?: string
  category: 'tutorial' | 'review' | 'news' | 'guide'
  tags: string[]
  author: string
  relatedToolSlugs: string[]
  toc?: Array<{ id: string; text: string; level: number }>
  relatedCollectionSlugs?: string[]
  updatedAt?: string
  publishedAt: string
  views: number
  source?: string // RSS 来源标识
  sourceUrl?: string // 原文链接
}

// 空数组：所有文章必须从 news-draft.ts 审核发布
export const articles: Article[] = []

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug)
}

export function getArticlesByCategory(category: string) {
  if (category === 'all') return articles
  return articles.filter((a) => a.category === category)
}

export function getRecentArticles(limit: number = 5): Article[] {
  return articles.slice(0, limit)
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase()
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  )
}
