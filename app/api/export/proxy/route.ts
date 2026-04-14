import { NextRequest, NextResponse } from 'next/server';

// 只代理可灵视频 CDN，防止 SSRF 攻击
const ALLOWED_SUFFIXES = [
  'klingai.com',
  'byteimg.com',
  'bytedance.com',
  'klingai-prod.com',
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL 格式无效' }, { status: 400 });
  }

  if (!ALLOWED_SUFFIXES.some((s) => parsed.hostname.endsWith(s))) {
    return NextResponse.json({ error: '不允许的视频域名' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`上游 ${upstream.status}`);

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': 'attachment',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
