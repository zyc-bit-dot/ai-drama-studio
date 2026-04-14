'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, Loader2, CheckCircle2, XCircle, Clock, Sparkles,
  ArrowLeft, ArrowRight, Plus, Trash2, PackageOpen, FileText, StopCircle, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Scene, SceneStatus } from '@/types';
import { getApiHeaders } from '@/lib/apiKeys';
import { getGenreLabel } from '@/lib/genres';
import { exportZip, exportScript } from '@/lib/exportUtils';

interface Props {
  scenes: Scene[];
  projectTitle: string;
  onGenerateVideo: (scene: Scene) => void;
  onCancelGeneration: (id: string) => void;
  onUpdatePrompt: (sceneId: string, newPrompt: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (id: string) => void;
}

const statusConfig: Record<
  SceneStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }
> = {
  idle:       { label: '待生成', variant: 'secondary',   icon: <Clock className="w-3 h-3" /> },
  pending:    { label: '排队中', variant: 'outline',     icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  generating: { label: '生成中', variant: 'default',     icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed:  { label: '已完成', variant: 'default',     icon: <CheckCircle2 className="w-3 h-3" /> },
  failed:     { label: '失败',   variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
};

interface CardProps {
  scene: Scene;
  arrayIndex: number;   // 在数组中的实际位置（0-based）
  isFirst: boolean;
  isLast: boolean;
  onGenerateVideo: (s: Scene) => void;
  onCancelGeneration: (id: string) => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (id: string) => void;
}

function SceneCard({
  scene, arrayIndex, isFirst, isLast,
  onGenerateVideo, onCancelGeneration, onUpdatePrompt,
  onMoveUp, onMoveDown, onDelete, onInsertAfter,
}: CardProps) {
  const [polishing, setPolishing] = useState(false);
  const cfg = statusConfig[scene.status];
  const isActive = scene.status === 'pending' || scene.status === 'generating';
  const isDone = scene.status === 'completed';
  // 所有管理按钮在生成中禁用，防止状态错乱
  const managementDisabled = isActive;

  const handlePolish = async () => {
    if (!scene.prompt.trim()) { toast.warning('提示词不能为空'); return; }
    setPolishing(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
        body: JSON.stringify({ prompt: scene.prompt }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'AI 润色失败'); return; }
      onUpdatePrompt(scene.id, data.result);
      toast.success('润色完成');
    } catch {
      toast.error('网络错误，润色失败');
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card flex flex-col">
      {/* ── 缩略图 ── */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {isDone && scene.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.thumbnailUrl} alt={scene.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl select-none">🎬</span>
        )}
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        {/* 左上：序号（动态）+ 题材 */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs font-mono">
            #{arrayIndex + 1}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {getGenreLabel(scene.genre)}
          </Badge>
        </div>
        {/* 右上：状态 */}
        <div className="absolute top-2 right-2">
          <Badge variant={cfg.variant} className="text-xs flex items-center gap-1">
            {cfg.icon}{cfg.label}
          </Badge>
        </div>
      </div>

      {/* ── 卡片主体 ── */}
      <div className="p-3 space-y-2 flex flex-col flex-1">

        {/* 标题行 + 管理按钮 */}
        <div className="flex items-center justify-between gap-1 shrink-0">
          <h3 className="text-sm font-medium leading-tight truncate flex-1">
            {scene.title || '新分镜'}
          </h3>
          {/* 四个管理按钮 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={managementDisabled || isFirst}
              onClick={() => onMoveUp(scene.id)}
              title="向前移"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={managementDisabled || isLast}
              onClick={() => onMoveDown(scene.id)}
              title="向后移"
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={managementDisabled}
              onClick={() => onInsertAfter(scene.id)}
              title="在此后插入分镜"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-destructive"
              disabled={managementDisabled}
              onClick={() => onDelete(scene.id)}
              title="删除分镜"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* 场景描述 */}
        {scene.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 shrink-0">
            {scene.description}
          </p>
        )}

        {/* 可编辑 Prompt + AI 润色 */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">提示词 (Prompt)</label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs gap-1"
              onClick={handlePolish}
              disabled={polishing || isActive}
            >
              {polishing
                ? <><Loader2 className="w-3 h-3 animate-spin" />润色中...</>
                : <><Sparkles className="w-3 h-3" />AI 润色</>
              }
            </Button>
          </div>
          <Textarea
            className="text-xs leading-relaxed resize-none min-h-[72px]"
            value={scene.prompt}
            onChange={(e) => onUpdatePrompt(scene.id, e.target.value)}
            disabled={isActive || polishing}
            placeholder="输入或修改提示词..."
          />
        </div>

        {/* 进度条 + 中断按钮 */}
        {isActive && (
          <div className="flex items-center gap-2 shrink-0">
            <Progress value={scene.progress} className="h-1.5 flex-1" />
            <Button
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs gap-1 shrink-0"
              onClick={() => onCancelGeneration(scene.id)}
              title="中断生成"
            >
              <StopCircle className="w-3 h-3" />
              中断
            </Button>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="shrink-0 space-y-1.5">
          {(scene.status === 'idle' || scene.status === 'failed' || scene.status === 'completed') && (
            <Button
              size="sm"
              variant={scene.status === 'failed' ? 'destructive' : 'default'}
              className="w-full text-xs"
              onClick={() => onGenerateVideo(scene)}
            >
              <Play className="w-3 h-3 mr-1.5" />
              {scene.status === 'failed' ? '重新生成' : scene.status === 'completed' ? '重新生成' : '生成视频'}
            </Button>
          )}
          {isDone && scene.videoUrl && (
            <div className="flex gap-1.5">
              <a href={scene.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <Play className="w-3 h-3 mr-1.5" />播放
                </Button>
              </a>
              <a href={scene.videoUrl} download target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <Download className="w-3 h-3 mr-1.5" />下载
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoryboardPreview({
  scenes, projectTitle, onGenerateVideo, onCancelGeneration, onUpdatePrompt,
  onMoveUp, onMoveDown, onDelete, onInsertAfter,
}: Props) {
  const completedCount = scenes.filter((s) => s.status === 'completed').length;
  const [zipping, setZipping] = useState(false);

  const handleExportZip = async () => {
    setZipping(true);
    const toastId = toast.loading('正在打包视频，请稍候...');
    try {
      await exportZip(scenes, projectTitle, (done, total) => {
        toast.loading(`打包中 ${done}/${total}...`, { id: toastId });
      });
      toast.success('ZIP 下载完成！', { id: toastId });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '打包失败', { id: toastId });
    } finally {
      setZipping(false);
    }
  };

  const handleExportScript = () => {
    try {
      exportScript(scenes, projectTitle);
      toast.success('剧本文件已下载');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '导出失败');
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold">🎞 分镜预览</h2>
        <div className="flex items-center gap-2">
          {scenes.length > 0 && (
            <>
              <Badge variant="outline" className="text-xs">
                {completedCount} / {scenes.length} 完成
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleExportScript}
              >
                <FileText className="w-3 h-3" />
                导出剧本
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleExportZip}
                disabled={zipping || completedCount === 0}
              >
                {zipping
                  ? <><Loader2 className="w-3 h-3 animate-spin" />打包中...</>
                  : <><PackageOpen className="w-3 h-3" />下载视频</>
                }
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {scenes.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm text-center">
              在左侧输入小说文本智能拆解，<br />或直接写分镜提示词添加卡片
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pr-3">
            {scenes.map((scene, idx) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                arrayIndex={idx}
                isFirst={idx === 0}
                isLast={idx === scenes.length - 1}
                onGenerateVideo={onGenerateVideo}
                onCancelGeneration={onCancelGeneration}
                onUpdatePrompt={onUpdatePrompt}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onDelete={onDelete}
                onInsertAfter={onInsertAfter}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
