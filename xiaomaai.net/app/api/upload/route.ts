import { NextRequest, NextResponse } from 'next/server';

// 本地代理上传到 catbox.moe / litterbox.catbox.moe
// 适用于 next dev 开发环境，解决浏览器 CORS 限制

const CATBOX_API = 'https://litterbox.catbox.moe/resources/internals/api.php';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('fileToUpload') as File | null;
    if (!file) {
      return NextResponse.json({ error: '缺少 fileToUpload' }, { status: 400 });
    }

    const reqtype = formData.get('reqtype')?.toString() || 'fileupload';
    const time = formData.get('time')?.toString() || '24h';

    // 构造发给 catbox 的 FormData
    const upstream = new FormData();
    upstream.append('reqtype', reqtype);
    upstream.append('time', time);
    upstream.append('fileToUpload', file);

    const res = await fetch(CATBOX_API, {
      method: 'POST',
      body: upstream,
      signal: AbortSignal.timeout(60000), // 60s 超时
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `catbox 返回 HTTP ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const text = (await res.text()).trim();
    // catbox 直接返回 URL 文本
    if (!text || !/^https?:\/\//i.test(text)) {
      return NextResponse.json(
        { error: `catbox 返回非 URL: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: text });
  } catch (e: any) {
    console.error('[API /api/upload] 上传失败:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || '上传失败' },
      { status: 500 },
    );
  }
}