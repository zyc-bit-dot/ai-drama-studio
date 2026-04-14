import jwt from 'jsonwebtoken';
import { getDecryptedConfig } from '@/lib/server/config';
import { VideoService, VideoTaskResult, KlingTaskStatus } from './VideoService';

const KLING_BASE = 'https://api-beijing.klingai.com';

export class KlingAdapter implements VideoService {
  // akOverride / skOverride: keys from BYOK header; fall back to server config
  private resolveKeys(akOverride?: string, skOverride?: string) {
    const cfg = getDecryptedConfig();
    const accessKey = (akOverride?.trim() || cfg.klingAccessKey).trim();
    const secretKey = (skOverride?.trim() || cfg.klingSecretKey).trim();
    if (!accessKey || !secretKey) {
      throw new Error('未配置可灵 API 密钥，请在右上角"设置"中添加 Access Key 和 Secret Key');
    }
    return { accessKey, secretKey };
  }

  private generateToken(accessKey: string, secretKey: string): string {
    const payload = {
      iss: accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800,
      nbf: Math.floor(Date.now() / 1000) - 5,
    };
    return jwt.sign(payload, secretKey);
  }

  private authHeaders(accessKey: string, secretKey: string) {
    const token = this.generateToken(accessKey, secretKey);
    return {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    };
  }

  async submitTask(prompt: string, akOverride?: string, skOverride?: string): Promise<string> {
    const { accessKey, secretKey } = this.resolveKeys(akOverride, skOverride);
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video`, {
      method: 'POST',
      headers: this.authHeaders(accessKey, secretKey),
      body: JSON.stringify({
        model_name: 'kling-v1',
        prompt,
      }),
    });

    const json = await res.json();
    console.log('[Kling] submitTask response:', JSON.stringify(json));

    if (!res.ok || json.code !== 0) {
      throw new Error(
        `可灵任务提交失败：${json.message ?? res.statusText}（code: ${json.code}）`
      );
    }

    const taskId: string = json.data?.task_id;
    if (!taskId) throw new Error('可灵返回数据缺少 task_id');
    return taskId;
  }

  async queryTask(taskId: string, akOverride?: string, skOverride?: string): Promise<VideoTaskResult> {
    const { accessKey, secretKey } = this.resolveKeys(akOverride, skOverride);
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video/${taskId}`, {
      method: 'GET',
      headers: this.authHeaders(accessKey, secretKey),
    });

    const json = await res.json();

    if (!res.ok || json.code !== 0) {
      throw new Error(
        `可灵查询失败：${json.message ?? res.statusText}（code: ${json.code}）`
      );
    }

    const data = json.data ?? {};
    const klingStatus: KlingTaskStatus = data.task_status ?? 'failed';

    const progressMap: Record<KlingTaskStatus, number> = {
      submitted:  10,
      processing: 50,
      succeed:    100,
      failed:     0,
    };

    return {
      taskId,
      klingStatus,
      progress: progressMap[klingStatus] ?? 0,
      videoUrl: data.task_result?.videos?.[0]?.url,
      coverUrl: data.task_result?.videos?.[0]?.cover_image_url,
    };
  }
}

export const klingAdapter = new KlingAdapter();
