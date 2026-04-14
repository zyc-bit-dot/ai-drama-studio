'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Scene } from '@/types';

interface Props {
  scenes: Scene[];
}

export function VideoProgress({ scenes }: Props) {
  const activeScenes = scenes.filter(
    (s) => s.status === 'pending' || s.status === 'generating' || s.status === 'completed' || s.status === 'failed'
  );

  const totalCompleted = scenes.filter((s) => s.status === 'completed').length;
  const totalScenes = scenes.length;
  const overallProgress = totalScenes > 0 ? Math.round((totalCompleted / totalScenes) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header + Overall Progress */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold shrink-0">🎬 生成进度</h2>
        {totalScenes > 0 && (
          <>
            <Progress value={overallProgress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground shrink-0">
              {totalCompleted}/{totalScenes} 完成 ({overallProgress}%)
            </span>
          </>
        )}
        {totalScenes === 0 && (
          <span className="text-xs text-muted-foreground">暂无任务</span>
        )}
      </div>

      {/* Per-scene progress list */}
      {activeScenes.length > 0 && (
        <ScrollArea className="max-h-24">
          <div className="space-y-1.5 pr-2">
            {activeScenes.map((scene) => (
              <div key={scene.id} className="flex items-center gap-3">
                {/* Icon */}
                <div className="shrink-0">
                  {scene.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {scene.status === 'failed' && <XCircle className="w-4 h-4 text-destructive" />}
                  {(scene.status === 'pending' || scene.status === 'generating') && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </div>

                {/* Label */}
                <span className="text-xs w-20 shrink-0 truncate">
                  #{scene.index} {scene.title}
                </span>

                {/* Progress bar */}
                <Progress
                  value={scene.progress}
                  className="flex-1 h-1.5"
                />

                {/* Status badge */}
                <Badge
                  variant={
                    scene.status === 'completed'
                      ? 'default'
                      : scene.status === 'failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs shrink-0 w-16 justify-center"
                >
                  {scene.status === 'completed'
                    ? '完成'
                    : scene.status === 'failed'
                    ? '失败'
                    : `${scene.progress}%`}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
