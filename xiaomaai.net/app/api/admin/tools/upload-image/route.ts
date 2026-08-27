export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'

// POST /api/admin/tools/upload-image - 上传工具图片到对象存储(规划中)
export async function POST(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: '图片上传到对象存储规划中' },
    { status: 501 }
  )
}

// GET /api/admin/tools/upload-image - 占位(规划中)
export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: '图片上传到对象存储规划中' },
    { status: 501 }
  )
}
