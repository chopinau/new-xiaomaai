import { articles } from '@/data/articles'

export const runtime = 'edge';

export async function GET() {
  const baseUrl = 'https://xiaomaai.net'
  
  const items = articles.slice(0, 20).map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/articles/${article.slug}</link>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <guid>${baseUrl}/articles/${article.slug}</guid>
    </item>
  `).join('')
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>小马 AI 工具中心</title>
        <link>${baseUrl}</link>
        <description>聚合全球 AI 工具，发现下一代人工智能生产力</description>
        <language>zh-CN</language>
        <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
        ${items}
      </channel>
    </rss>`
  
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
