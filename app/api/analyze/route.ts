import { NextRequest, NextResponse } from 'next/server';
import { deepSeekAdapter } from '@/lib/server/llm/DeepSeekAdapter';
import { AnalyzeRequest, AnalyzeResponse, Scene } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const text = body.novelText?.trim() ?? '';

    if (text.length < 10) {
      return NextResponse.json({ error: '小说文本太短，请至少输入10个字' }, { status: 400 });
    }

    const deepseekKey = req.headers.get('x-deepseek-key') ?? undefined;
    const result = await deepSeekAdapter.analyzeNovel(text, deepseekKey);

    // 转换为前端 Scene 格式
    const scenes: Scene[] = result.scenes.map((s) => ({
      id: `scene-${s.index}-${Date.now()}`,
      index: s.index,
      title: s.title,
      description: s.description,
      prompt: s.prompt,
      genre: s.genre,
      status: 'idle',
      progress: 0,
    }));

    const response: AnalyzeResponse = {
      scenes,
      genre: result.genre,
      title: result.title,
    };

    return NextResponse.json(response);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/analyze]', message);
    // 区分用户配置问题 vs 服务端错误
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
