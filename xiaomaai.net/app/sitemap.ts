import type { MetadataRoute } from 'next'
import { tools } from '@/data/tools'
import { getCollections } from '@/data/collections'
import { articles } from '@/data/articles'
import { manuals } from '@/data/manuals'
import { workflows } from '@/data/workflows'
import { newsItems } from '@/data/news'

const baseUrl = 'https://xiaomaai.net'
const now = new Date()

type SitemapEntry = MetadataRoute.Sitemap[number]

export default function sitemap(): MetadataRoute.Sitemap {
  // ---- 静态页（列表 / 产品 / 资源页）----
  const staticPages: SitemapEntry[] = [
    // 首页
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    // 核心列表页
    { url: `${baseUrl}/tools`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/rankings`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/manuals`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/workflows`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // 产品 / 工具页
    { url: `${baseUrl}/prompts`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/utilities`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/canvas`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/flow`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/bookmarks`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/pdf`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/pptx`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/psd`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/gif`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/remover`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/fenge`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/codex`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // ---- 精选榜单页（/best 无独立页，仅 /best/{category}）----
  const bestCategories = ['chat', 'image', 'video', 'audio', 'code', 'productivity']
  const bestPages: SitemapEntry[] = bestCategories.map((category) => ({
    url: `${baseUrl}/best/${category}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ---- 工具详情 ----
  const toolPages: SitemapEntry[] = tools.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(tool.updatedAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ---- 专题详情 ----
  const collectionPages: SitemapEntry[] = getCollections().map((collection) => ({
    url: `${baseUrl}/collections/${collection.slug}`,
    lastModified: collection.updatedAt
      ? new Date(collection.updatedAt)
      : collection.publishedAt
        ? new Date(collection.publishedAt)
        : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ---- 文章详情 ----
  const articlePages: SitemapEntry[] = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(article.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // ---- 手册详情 ----
  const manualPages: SitemapEntry[] = manuals.map((manual) => ({
    url: `${baseUrl}/manuals/${manual.slug}`,
    lastModified: new Date(manual.updatedAt || manual.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // ---- 工作流详情（数据无时间字段，使用当前时间）----
  const workflowPages: SitemapEntry[] = workflows.map((workflow) => ({
    url: `${baseUrl}/workflows/${workflow.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // ---- 新闻详情 ----
  const newsPages: SitemapEntry[] = newsItems.map((item) => ({
    url: `${baseUrl}/news/${item.id}`,
    lastModified: new Date(item.date),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // ---- 标签页（从工具 tags 聚合去重，与站内链接一致使用 encodeURIComponent）----
  const tagSet = new Set<string>()
  tools.forEach((tool) => tool.tags?.forEach((tag) => tagSet.add(tag)))
  const tagPages: SitemapEntry[] = Array.from(tagSet).map((tag) => ({
    url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // 按最后更新时间倒序排列（最新优先）
  const lastModifiedTime = (value: Date | string | undefined): number =>
    value instanceof Date ? value.getTime() : value ? new Date(value).getTime() : 0

  return [
    ...staticPages,
    ...bestPages,
    ...toolPages,
    ...collectionPages,
    ...articlePages,
    ...manualPages,
    ...workflowPages,
    ...newsPages,
    ...tagPages,
  ].sort((a, b) => lastModifiedTime(b.lastModified) - lastModifiedTime(a.lastModified))
}
