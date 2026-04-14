// 项目（多剧本管理）
export interface Project {
  id: string;
  title: string;
  scenes: Scene[];
  updatedAt: number; // Unix ms
}

// 分镜场景
export interface Scene {
  id: string;
  index: number;
  title: string;
  description: string;       // 场景文字描述（给人看）
  prompt: string;            // 视频生成提示词（给模型用）
  genre: string;             // 题材标签，用于 VideoServiceFactory 路由
  status: SceneStatus;
  progress: number;          // 0-100
  taskId?: string;           // 可灵任务 ID，用于页面刷新后恢复轮询
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;         // 秒
}

export type SceneStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'failed';

// API Key 配置（前端用脱敏版本）
export interface ApiKeyConfig {
  deepseekKey: string;          // 脱敏显示，如 ****xxxx
  klingAccessKey: string;       // 可灵 Access Key（部分脱敏）
  klingSecretKey: string;       // 可灵 Secret Key（完全遮挡）
  hasDeepseekKey: boolean;
  hasKlingAccessKey: boolean;
  hasKlingSecretKey: boolean;
}

// 设置保存请求
export interface SaveSettingsRequest {
  deepseekKey?: string;
  klingAccessKey?: string;
  klingSecretKey?: string;
}

// Mock 分析请求/响应
export interface AnalyzeRequest {
  novelText: string;
}

export interface AnalyzeResponse {
  scenes: Scene[];
  genre: string;
  title: string;
}

// Mock 视频生成请求
export interface GenerateRequest {
  sceneId: string;
  prompt: string;
}
