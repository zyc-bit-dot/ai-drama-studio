// 视频服务接口定义 — 所有视频适配器必须实现此接口

export type KlingTaskStatus = 'submitted' | 'processing' | 'succeed' | 'failed';

export interface VideoTaskResult {
  taskId: string;
  klingStatus: KlingTaskStatus;  // Kling 原始状态
  progress: number;              // 0-100，前端展示用
  videoUrl?: string;
  coverUrl?: string;
  errorMessage?: string;
}

export interface VideoService {
  /** 提交文生视频任务，返回 taskId */
  submitTask(prompt: string): Promise<string>;
  /** 查询任务状态与结果 */
  queryTask(taskId: string): Promise<VideoTaskResult>;
}
