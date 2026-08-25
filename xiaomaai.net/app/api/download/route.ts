export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';


// 本地下载代理：解决跨域视频无法 fetch 下载的问题
// 浏览器请求 /api/download?url=xxx，服务端下载后流式返回

export async function GET(request: NextRequest) {
  const remoteUrl = request.nextUrl.searchParams.get('url');
  if (!remoteUrl) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  // 只允许代理已知的视频/图片域名
  const allowedHosts = [
    'api.lk888.ai',
    'catbox.moe',
    'litterbox.catbox.moe',
    'api.xiaomaai.net',
    'tmpfiles.org',
    'volces.com',
    'bytedance.com',
    'googleapis.com',
    'storage.googleapis.com',
    'storage-googleapis.com',
  ];
  try {
    const host = new URL(remoteUrl).hostname;
    const allowed = allowedHosts.some(h => host === h || host.endsWith('.' + h));
    if (!allowed) {
      console.warn('[API /api/download] 不允许的域名:', host);
      return NextResponse.json({ error: '不允许的域名' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: '无效 URL' }, { status: 400 });
  }

  try {
    const res = await fetch(remoteUrl, {
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `远程返回 HTTP ${res.status}` },
        { status: 502 },
      );
    }

    // 从 Content-Type 判断扩展名
    const contentType = res.headers.get('content-type') || 'video/mp4';
    const extMap: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[contentType] || '.mp4';

    // 从 URL 提取文件名
    const urlPath = new URL(remoteUrl).pathname;
    const baseName = urlPath.split('/').pop()?.split('?')[0] || 'video';
    const fileName = baseName.includes('.') ? baseName : `xiaoma-video-${Date.now()}${ext}`;

    // 流式返回，设置 Content-Disposition 强制下载
    const body = res.body;
    if (!body) {
      return NextResponse.json({ error: '远程无响应体' }, { status: 502 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e: any) {
    console.error('[API /api/download] 下载失败:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || '下载失败' },
      { status: 500 },
    );
  }
}
