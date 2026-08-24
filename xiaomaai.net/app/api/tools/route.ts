import { NextRequest, NextResponse } from 'next/server'
import { tools, searchTools, getCategories } from '@/data/tools'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100', 10)

  let result = tools

  if (query) {
    result = searchTools(query)
  }
  if (category) {
    result = result.filter(t => t.category === category)
  }
  if (featured) {
    result = result.filter(t => t.featured)
  }

  result = result.slice(0, limit)

  return NextResponse.json({
    success: true,
    total: result.length,
    totalAll: tools.length,
    categories: getCategories(),
    data: result,
  })
}
