import { NextRequest, NextResponse } from 'next/server';
import { klingAdapter } from '@/lib/server/video/KlingAdapter';
import { SceneStatus } from '@/types';

// Kling 状态 → 前端 SceneStatus 映射
const statusMap: Record<string, SceneStatus> = {
  submitted:  'pending',
  processing: 'generating',
  succeed:    'completed',
  failed:     'failed',
};

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId 参数' }, { status: 400 });
    }

    const akOverride = req.headers.get('x-kling-access') ?? undefined;
    const skOverride = req.headers.get('x-kling-secret') ?? undefined;
    const result = await klingAdapter.queryTask(taskId, akOverride, skOverride);
    const sceneStatus: SceneStatus = statusMap[result.klingStatus] ?? 'failed';

    console.log('[/api/video/status]', taskId, '→', result.klingStatus, '→', sceneStatus);

    return NextResponse.json({
      taskId: result.taskId,
      klingStatus: result.klingStatus,
      status: sceneStatus,
      progress: result.progress,
      videoUrl: result.videoUrl,
      coverUrl: result.coverUrl,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/video/status]', message);
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
