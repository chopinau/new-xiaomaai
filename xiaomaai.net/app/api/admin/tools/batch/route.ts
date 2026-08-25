import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PUT /api/admin/tools/batch - 批量修改工具分类(规划中)
export async function PUT(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: '批量改分类 API 规划中' },
    { status: 501 }
  )
}

// POST /api/admin/tools/batch - 批量修改工具分类(规划中)
export async function POST(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: '批量改分类 API 规划中' },
    { status: 501 }
  )
}
