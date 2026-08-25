import { NextRequest, NextResponse } from 'next/server'
import { articles, searchArticles, getRecentArticles } from '@/data/articles'

export const runtime = 'edge';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const recent = searchParams.get('recent')

  if (recent) {
    return NextResponse.json({
      success: true,
      total: Math.min(limit, articles.length),
      data: getRecentArticles(limit),
    })
  }

  let result = articles
  if (query) {
    result = searchArticles(query)
  }
  if (category) {
    result = result.filter(a => a.category === category)
  }
  result = result.slice(0, limit)

  return NextResponse.json({
    success: true,
    total: result.length,
    data: result,
  })
}
