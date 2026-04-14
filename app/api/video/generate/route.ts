export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { signKlingJWT } from '@/lib/server/video/klingJwt';

const KLING_BASE = 'https://api-beijing.klingai.com';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 });
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
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: 'kling-v1', prompt: prompt.trim() }),
    });

    const json = await res.json() as { code?: number; message?: string; data?: { task_id?: string } };
    console.log('[/api/video/generate] response:', JSON.stringify(json));

    if (!res.ok || json.code !== 0) {
      throw new Error(`可灵任务提交失败：${json.message ?? res.statusText}（code: ${json.code}）`);
    }

    const taskId = json.data?.task_id;
    if (!taskId) throw new Error('可灵返回数据缺少 task_id');

    return NextResponse.json({ taskId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.error('[/api/video/generate]', message);
    const status = message.includes('未配置') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
