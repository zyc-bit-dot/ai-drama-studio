import OpenAI from 'openai';
import { getDecryptedConfig } from '@/lib/server/config';
import { LLMService, AnalyzeResult, SceneInput } from './LLMService';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

const ANALYZE_SYSTEM_PROMPT = `你是一位专业的短视频编剧和分镜师。请分析用户提供的小说片段，将其拆解为 3 至 6 个适合拍摄短剧的电影场景。

严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "title": "故事标题（简短，中文，不超过10字）",
  "genre": "题材标签，只能从以下选项中选一个：survival / romance / thriller / action / drama / fantasy / comedy / scifi",
  "scenes": [
    {
      "index": 1,
      "title": "场景标题（中文，不超过10字）",
      "description": "场景描述（中文，2至3句话，描述发生了什么、人物状态）",
      "prompt": "视频生成提示词（英文，须包含：主体动作、画面构图、摄像机角度与运动、光线条件、色调风格、氛围情绪、电影质感关键词）",
      "genre": "该场景对应的题材（与主题材相同，或更细化）"
    }
  ]
}`;

const POLISH_SYSTEM_PROMPT = `你是一位专业的电影摄影师和短视频导演。将用户提供的简短场景描述扩写为一段专业的视频生成提示词。

扩写要求：
1. 加入具体的摄像机运动与角度（dolly shot / close-up / wide angle / handheld 等）
2. 描述光线条件和色调（golden hour / neon-lit / silhouette / chiaroscuro 等）
3. 补充大气和环境细节（weather / texture / depth of field / lens flare 等）
4. 刻画角色表情和情绪
5. 可引用知名导演风格（如 Christopher Nolan style / Wes Anderson composition 等）

只输出扩写后的提示词本身，不要任何解释、前缀或换行分段。输出语言：英文。`;

export class DeepSeekAdapter implements LLMService {
  // keyOverride: key passed from request header (BYOK); falls back to server config
  private getClient(keyOverride?: string): OpenAI {
    const key = keyOverride?.trim() || getDecryptedConfig().deepseekKey;
    if (!key) {
      throw new Error('未配置 DeepSeek API Key，请在右上角"设置"中添加');
    }
    return new OpenAI({ apiKey: key, baseURL: DEEPSEEK_BASE_URL });
  }

  async analyzeNovel(novelText: string, deepseekKey?: string): Promise<AnalyzeResult> {
    const client = this.getClient(deepseekKey);

    const response = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
        { role: 'user', content: `请拆解以下小说片段：\n\n${novelText}` },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`模型返回了无效 JSON：${raw.slice(0, 200)}`);
    }

    return validateAnalyzeResult(parsed);
  }

  async polishPrompt(prompt: string, deepseekKey?: string): Promise<string> {
    const client = this.getClient(deepseekKey);

    const response = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: POLISH_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() ?? prompt;
  }
}

// 结构验证：确保模型输出符合预期，避免前端崩溃
function validateAnalyzeResult(data: unknown): AnalyzeResult {
  if (typeof data !== 'object' || data === null) {
    throw new Error('模型返回结构异常：顶层不是对象');
  }
  const d = data as Record<string, unknown>;

  const title = typeof d.title === 'string' ? d.title : '未命名故事';
  const genre = typeof d.genre === 'string' ? d.genre : 'drama';

  if (!Array.isArray(d.scenes) || d.scenes.length === 0) {
    throw new Error('模型返回的 scenes 数组为空或格式错误');
  }

  const scenes: SceneInput[] = d.scenes.map((s: unknown, i: number) => {
    const scene = s as Record<string, unknown>;
    return {
      index: typeof scene.index === 'number' ? scene.index : i + 1,
      title: typeof scene.title === 'string' ? scene.title : `场景 ${i + 1}`,
      description: typeof scene.description === 'string' ? scene.description : '',
      prompt: typeof scene.prompt === 'string' ? scene.prompt : '',
      genre: typeof scene.genre === 'string' ? scene.genre : genre,
    };
  });

  return { title, genre, scenes };
}

// 单例导出，避免重复实例化
export const deepSeekAdapter = new DeepSeekAdapter();
