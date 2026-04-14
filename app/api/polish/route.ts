import { NextRequest, NextResponse } from 'next/server';
import { deepSeekAdapter } from '@/lib/server/llm/DeepSeekAdapter';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 });
    }

    const deepseekKey = req.headers.get('x-deepseek-key') ?? undefined;
    const result = await deepSeekAdapter.polishPrompt(prompt.trim(), deepseekKey);
    return NextResponse.json({ result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/polish]', message);
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
