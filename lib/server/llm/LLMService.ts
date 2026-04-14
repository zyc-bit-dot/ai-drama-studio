// LLM 服务接口定义 — 所有 LLM 适配器必须实现此接口

export interface SceneInput {
  index: number;
  title: string;
  description: string;
  prompt: string;
  genre: string;
}

export interface AnalyzeResult {
  title: string;
  genre: string;
  scenes: SceneInput[];
}

export interface LLMService {
  /** 分析小说文本，返回拆解后的分镜数组 */
  analyzeNovel(novelText: string): Promise<AnalyzeResult>;

  /** 将简短提示词扩写为专业镜头语言 */
  polishPrompt(prompt: string): Promise<string>;
}
