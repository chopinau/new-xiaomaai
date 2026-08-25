import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 视频流代理：解决跨域视频无法在 <video> 标签中播放的问题
// 浏览器请求 /api/video?url=xxx，服务端流式转发视频

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const remoteUrl = request.nextUrl.searchParams.get('url');
  if (!remoteUrl) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  // 只允许代理已知的视频域名（宽松匹配，覆盖动态子域名）
  const allowedHosts = [
    'api.lk888.ai',
    'catbox.moe',
    'litterbox.catbox.moe',
    'api.xiaomaai.net',
    'tmpfiles.org',
    'ai.storage.googleapis.com',
    'volces.com',
    'bytedance.com',
    'googleapis.com',
    'ark-content-generation',
    'storage.googleapis.com',
  ];
  try {
    const host = new URL(remoteUrl).hostname;
    const allowed = allowedHosts.some(h => host === h || host.endsWith('.' + h));
    if (!allowed) {
      console.warn('[API /api/video] 不允许的域名:', host);
      return NextResponse.json({ error: '不允许的域名' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: '无效 URL' }, { status: 400 });
  }

  try {
    // 转发请求头（支持 Range 请求，用于视频进度条拖拽）
    const headers: Record<string, string> = {};
    const range = request.headers.get('range');
    if (range) headers['Range'] = range;

    const res = await fetch(remoteUrl, {
      headers,
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `远程返回 HTTP ${res.status}` },
        { status: 502 },
      );
    }

    // 获取视频元数据
    const contentType = res.headers.get('content-type') || 'video/mp4';
    const contentLength = res.headers.get('content-length');
    const contentRange = res.headers.get('content-range');

    // 构建响应头
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    };
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    // 流式返回
    const body = res.body;
    if (!body) {
      return NextResponse.json({ error: '远程无响应体' }, { status: 502 });
    }

    return new Response(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (e: any) {
    console.error('[API /api/video] 流式转发失败:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || '视频加载失败' },
      { status: 500 },
    );
  }
}
