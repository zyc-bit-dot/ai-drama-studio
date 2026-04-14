import { NextRequest } from 'next/server';

// Mock 视频生成：SSE 流式推送进度
export async function POST(req: NextRequest) {
  const { sceneId } = await req.json();
  void sceneId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 模拟提交任务
      await sleep(500);
      send({ status: 'pending', progress: 0, message: '任务已提交，排队中...' });

      // 模拟生成进度
      const steps = [
        { progress: 15, message: '解析提示词...' },
        { progress: 30, message: '生成关键帧...' },
        { progress: 50, message: '渲染视频序列...' },
        { progress: 70, message: '合成音效...' },
        { progress: 85, message: '后期处理中...' },
        { progress: 95, message: '上传结果...' },
      ];

      for (const step of steps) {
        await sleep(800 + Math.random() * 400);
        send({ status: 'generating', ...step });
      }

      await sleep(600);
      // Mock 视频 URL（用 placeholder 图片模拟封面）
      send({
        status: 'completed',
        progress: 100,
        message: '生成完成！',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
