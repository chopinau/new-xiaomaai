import { NextResponse } from 'next/server'
import { getCollections, collections } from '@/data/collections'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    success: true,
    total: collections.length,
    data: getCollections(),
  })
}
