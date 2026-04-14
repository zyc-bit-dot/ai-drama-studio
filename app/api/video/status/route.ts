export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { signKlingJWT } from '@/lib/server/video/klingJwt';
import { SceneStatus } from '@/types';

const KLING_BASE = 'https://api-beijing.klingai.com';

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

    const accessKey = req.headers.get('x-kling-access')?.trim() ?? '';
    const secretKey = req.headers.get('x-kling-secret')?.trim() ?? '';
    if (!accessKey || !secretKey) {
      return NextResponse.json(
        { error: '未配置可灵 API 密钥，请在右上角"设置"中添加 Access Key 和 Secret Key' },
        { status: 400 }
      );
    }

    const token = await signKlingJWT(accessKey, secretKey);
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json() as {
      code?: number;
      message?: string;
      data?: {
        task_status?: string;
        task_result?: { videos?: Array<{ url?: string; cover_image_url?: string }> };
      };
    };

    if (!res.ok || json.code !== 0) {
      throw new Error(`可灵查询失败：${json.message ?? res.statusText}（code: ${json.code}）`);
    }

    const klingStatus = json.data?.task_status ?? 'failed';
    const sceneStatus: SceneStatus = statusMap[klingStatus] ?? 'failed';
    const videoUrl  = json.data?.task_result?.videos?.[0]?.url;
    const coverUrl  = json.data?.task_result?.videos?.[0]?.cover_image_url;

    console.log('[/api/video/status]', taskId, '→', klingStatus, '→', sceneStatus);

    return NextResponse.json({ taskId, klingStatus, status: sceneStatus, videoUrl, coverUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/video/status]', message);
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
