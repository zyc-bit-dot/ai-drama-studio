import { NextRequest, NextResponse } from 'next/server';
import { klingAdapter } from '@/lib/server/video/KlingAdapter';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 });
    }

    const akOverride = req.headers.get('x-kling-access') ?? undefined;
    const skOverride = req.headers.get('x-kling-secret') ?? undefined;
    const taskId = await klingAdapter.submitTask(prompt.trim(), akOverride, skOverride);
    return NextResponse.json({ taskId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/video/generate]', message);
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
