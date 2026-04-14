'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Project } from '@/types';

interface Props {
  projects: Project[];
  activeProjectId: string;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function ProjectLibrary({
  projects, activeProjectId, onSwitch, onDelete, onNew,
}: Props) {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 px-2">
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            我的剧本库
            <Badge variant="secondary" className="ml-auto text-xs">{projects.length}</Badge>
          </Button>
        }
      />

      <SheetContent side="left" className="w-80 flex flex-col p-4 gap-4">
        <SheetHeader>
          <SheetTitle className="text-sm">📁 我的剧本库</SheetTitle>
        </SheetHeader>

        <Button size="sm" className="w-full gap-2 shrink-0" onClick={onNew}>
          <Plus className="w-4 h-4" />
          新建剧本
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {sorted.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              暂无历史剧本
            </p>
          )}

          {sorted.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                onClick={() => onSwitch(project.id)}
                className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-primary/10 border-primary/30'
                    : 'hover:bg-muted border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {project.title || '未命名剧本'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.scenes.length} 个分镜 ·{' '}
                    {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                {isActive ? (
                  <Badge variant="default" className="text-xs shrink-0">当前</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                    title="删除剧本"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
