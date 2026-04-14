import { NextRequest, NextResponse } from 'next/server';
import { Scene, AnalyzeRequest, AnalyzeResponse } from '@/types';

// Mock 分镜拆解：模拟 LLM 返回结果
export async function POST(req: NextRequest) {
  const body: AnalyzeRequest = await req.json();
  const text = body.novelText ?? '';

  if (text.trim().length < 10) {
    return NextResponse.json({ error: '小说文本太短，请至少输入10个字' }, { status: 400 });
  }

  // 模拟处理延迟
  await new Promise((r) => setTimeout(r, 1200));

  const scenes: Scene[] = [
    {
      id: 'scene-1',
      index: 1,
      title: '荒野求生',
      description: '主角从飞机残骸中爬出，四周是无边无际的雪山荒野，寒风刺骨，远处有狼嚎声。',
      prompt: 'A survivor crawls out of a crashed airplane in a vast snowy wilderness, fierce cold wind, wolves howling in the distance, cinematic wide shot, golden hour lighting',
      genre: 'survival',
      status: 'idle',
      progress: 0,
    },
    {
      id: 'scene-2',
      index: 2,
      title: '发现营地',
      description: '主角拖着伤腿攀过山脊，眼前出现一处废弃的猎人小屋，屋内有未熄灭的炭火。',
      prompt: 'An injured survivor drags himself over a snowy ridge to discover an abandoned hunter cabin, warm embers glowing inside, dramatic close-up, survival thriller',
      genre: 'survival',
      status: 'idle',
      progress: 0,
    },
    {
      id: 'scene-3',
      index: 3,
      title: '神秘信号',
      description: '主角在小屋内找到一台老式无线电，拨弄之间收到了一段断断续续的求救信号。',
      prompt: 'Survivor finds an old shortwave radio in a cabin, crackling distress signal received, flickering candlelight, tension and mystery, close-up on static display',
      genre: 'thriller',
      status: 'idle',
      progress: 0,
    },
    {
      id: 'scene-4',
      index: 4,
      title: '危险来临',
      description: '窗外出现黑影，脚步声越来越近。主角关掉无线电，握紧了手中的猎刀。',
      prompt: 'Dark silhouette approaching cabin window through blizzard, survivor grips hunting knife, extreme tension, horror thriller atmosphere, handheld camera style',
      genre: 'action',
      status: 'idle',
      progress: 0,
    },
    {
      id: 'scene-5',
      index: 5,
      title: '意外转机',
      description: '闯入者是一个冻伤的小女孩，怀里抱着一只受伤的小狗，用微弱的声音说出了一个地名。',
      prompt: 'A frostbitten little girl enters the cabin holding an injured puppy, whispers a location name, emotional dramatic reveal, warm firelight, cinematic close-up on her face',
      genre: 'drama',
      status: 'idle',
      progress: 0,
    },
  ];

  const response: AnalyzeResponse = {
    scenes,
    genre: 'survival-thriller',
    title: '雪山求生',
  };

  return NextResponse.json(response);
}
