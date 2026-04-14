'use client';

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { NovelInput } from './NovelInput';
import { DirectInput } from './DirectInput';
import { StoryboardPreview } from './StoryboardPreview';
import { VideoProgress } from './VideoProgress';
import { ProjectLibrary } from './ProjectLibrary';
import { CharacterPanel } from './CharacterPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Scene, Project, CharacterProfile } from '@/types';
import { getApiHeaders } from '@/lib/apiKeys';

const STORAGE_KEY_PROJECTS   = 'drama-studio-projects';
const STORAGE_KEY_ACTIVE_ID  = 'drama-studio-active-id';
const POLL_INTERVAL_MS       = 5000;

function makeProject(overrides?: Partial<Project>): Project {
  return {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    scenes: [],
    characters: [],
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function StudioLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [projects, setProjects, , projectsReady] =
    useLocalStorage<Project[]>(STORAGE_KEY_PROJECTS, []);
  const [activeProjectId, setActiveProjectId, , idReady] =
    useLocalStorage<string>(STORAGE_KEY_ACTIVE_ID, '');

  const isHydrated = projectsReady && idReady;

  // ── 初始化：确保始终有一个合法的活跃项目 ────────────────────────
  const initDone = useRef(false);
  useEffect(() => {
    if (!isHydrated || initDone.current) return;
    initDone.current = true;

    if (projects.length === 0) {
      const p = makeProject();
      setProjects([p]);
      setActiveProjectId(p.id);
    } else if (!projects.find((p) => p.id === activeProjectId)) {
      const latest = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveProjectId(latest.id);
    }
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 当前项目（派生）────────────────────────────────────────────────
  const currentProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );
  const scenes       = currentProject?.scenes     ?? [];
  const projectTitle = currentProject?.title      ?? '';
  const characters   = currentProject?.characters ?? [];

  // 对当前项目的 scenes 和 title 写入
  const setScenes = useCallback(
    (value: Scene[] | ((prev: Scene[]) => Scene[])) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          const next = value instanceof Function ? value(p.scenes) : value;
          return { ...p, scenes: next, updatedAt: Date.now() };
        })
      );
    },
    [activeProjectId, setProjects]
  );

  const setProjectTitle = useCallback(
    (title: string) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId ? { ...p, title, updatedAt: Date.now() } : p
        )
      );
    },
    [activeProjectId, setProjects]
  );

  const setCharacters = useCallback(
    (value: CharacterProfile[] | ((prev: CharacterProfile[]) => CharacterProfile[])) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          const next = value instanceof Function ? value(p.characters ?? []) : value;
          return { ...p, characters: next, updatedAt: Date.now() };
        })
      );
    },
    [activeProjectId, setProjects]
  );

  // ── 视频轮询管理 ───────────────────────────────────────────────────
  const pollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  useEffect(() => {
    const refs = pollingRefs.current;
    return () => refs.forEach((id) => clearInterval(id));
  }, []);

  const stopPolling = useCallback((sceneId: string) => {
    const id = pollingRefs.current.get(sceneId);
    if (id !== undefined) { clearInterval(id); pollingRefs.current.delete(sceneId); }
  }, []);

  const stopAllPolling = useCallback(() => {
    pollingRefs.current.forEach((id) => clearInterval(id));
    pollingRefs.current.clear();
  }, []);

  const isAnyGenerating = useMemo(
    () => scenes.some((s) => s.status === 'pending' || s.status === 'generating'),
    [scenes]
  );

  // ── 项目管理 ───────────────────────────────────────────────────────
  const handleNewProject = useCallback(() => {
    stopAllPolling();
    const p = makeProject();
    setProjects((prev) => [...prev, p]);
    setActiveProjectId(p.id);
    toast.success('已创建新剧本');
  }, [stopAllPolling, setProjects, setActiveProjectId]);

  const handleSwitchProject = useCallback((id: string) => {
    if (id === activeProjectId) return;
    stopAllPolling();
    setActiveProjectId(id);
    toast.info('已切换剧本');
  }, [activeProjectId, stopAllPolling, setActiveProjectId]);

  const handleDeleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // 如果删的不是当前项目，直接返回
      return next;
    });
    toast.success('剧本已删除');
  }, [setProjects]);

  const handleClearWorkspace = useCallback(() => {
    stopAllPolling();
    setScenes([]);
    setProjectTitle('');
    toast.success('工作台已清空');
  }, [stopAllPolling, setScenes, setProjectTitle]);

  // ── Tab 1 ─────────────────────────────────────────────────────────
  const handleScenesGenerated = useCallback((newScenes: Scene[], title: string) => {
    setScenes(newScenes);
    setProjectTitle(title);
  }, [setScenes, setProjectTitle]);

  // ── Tab 2 ─────────────────────────────────────────────────────────
  const handleAddScene = useCallback((scene: Scene) => {
    setScenes((prev) => [...prev, scene]);
  }, [setScenes]);

  // ── Prompt 编辑 ────────────────────────────────────────────────────
  const handleUpdatePrompt = useCallback((sceneId: string, newPrompt: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, prompt: newPrompt } : s))
    );
  }, [setScenes]);

  // ── 排序 ──────────────────────────────────────────────────────────
  const handleMoveSceneUp = useCallback((id: string) => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, [setScenes]);

  const handleMoveSceneDown = useCallback((id: string) => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, [setScenes]);

  // ── 删除 & 插入 ───────────────────────────────────────────────────
  const handleDeleteScene = useCallback((id: string) => {
    stopPolling(id);
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }, [stopPolling, setScenes]);

  const handleInsertSceneAfter = useCallback((id: string) => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const newScene: Scene = {
        id: `scene-insert-${Date.now()}`,
        index: idx + 2,
        title: '新分镜',
        description: '',
        prompt: '',
        genre: prev[idx].genre,
        status: 'idle',
        progress: 0,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, newScene);
      return next;
    });
  }, [setScenes]);

  // ── 中断视频生成 ───────────────────────────────────────────────────
  const handleCancelGeneration = useCallback((id: string) => {
    stopPolling(id);
    setScenes((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: 'idle', progress: 0 } : s)
    );
    toast.info('已中断视频生成');
  }, [stopPolling, setScenes]);

  // ── 核心轮询逻辑（提取为独立函数，供新提交和刷新恢复共用）──────────
  const startPollingForTask = useCallback((sceneId: string, taskId: string) => {
    stopPolling(sceneId); // 防止重复注册
    const intervalId = setInterval(async () => {
      try {
        const r = await fetch(`/api/video/status?taskId=${encodeURIComponent(taskId)}`, {
          headers: getApiHeaders(),
        });
        const d = await r.json();
        if (!r.ok) return;

        const { status, videoUrl, coverUrl } = d as {
          status: Scene['status']; videoUrl?: string; coverUrl?: string;
        };

        setScenes((prev) =>
          prev.map((s) => {
            if (s.id !== sceneId) return s;
            const progress =
              status === 'completed' ? 100
              : status === 'failed'  ? 0
              : status === 'pending' ? Math.max(s.progress, 10)
              : Math.min(s.progress + 8, 90);
            return { ...s, status, progress, videoUrl: videoUrl ?? s.videoUrl, thumbnailUrl: coverUrl ?? s.thumbnailUrl };
          })
        );

        if (status === 'completed') { stopPolling(sceneId); toast.success('🎬 视频生成完成！'); }
        else if (status === 'failed') { stopPolling(sceneId); toast.error('视频生成失败，可重新尝试'); }
      } catch (e) { console.warn('[poll]', e); }
    }, POLL_INTERVAL_MS);
    pollingRefs.current.set(sceneId, intervalId);
  }, [stopPolling, setScenes]);

  // ── 页面加载后恢复轮询（刷新页面时 pending/generating 场景自动续轮）─
  const resumeDone = useRef(false);
  useEffect(() => {
    if (!isHydrated || resumeDone.current) return;
    resumeDone.current = true;
    const toResume = scenes.filter(
      (s) => (s.status === 'pending' || s.status === 'generating') && s.taskId
    );
    if (toResume.length > 0) {
      toResume.forEach((s) => startPollingForTask(s.id, s.taskId!));
      toast.info(`已恢复 ${toResume.length} 个生成中任务的轮询`);
    }
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 视频生成 ───────────────────────────────────────────────────────
  const handleGenerateVideo = useCallback(async (scene: Scene) => {
    stopPolling(scene.id);
    if (!scene.prompt.trim()) { toast.warning('请先填写提示词'); return; }

    setScenes((prev) =>
      prev.map((s) =>
        s.id === scene.id
          ? { ...s, status: 'pending', progress: 0, taskId: undefined, videoUrl: undefined, thumbnailUrl: undefined }
          : s
      )
    );

    // 追加已启用的角色外貌描述，提升人物一致性
    const enabledChars = characters.filter((c) => c.enabled && c.description.trim());
    let finalPrompt = scene.prompt.trim();
    if (enabledChars.length > 0) {
      const charDesc = enabledChars
        .map((c) => (c.name ? `${c.name}: ${c.description.trim()}` : c.description.trim()))
        .join('; ');
      finalPrompt += `. Maintain character consistency — ${charDesc}`;
    }

    const toastId = toast.loading('正在提交视频任务...');
    try {
      const genRes = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      const genData = await genRes.json();

      if (!genRes.ok) {
        toast.error(genData.error ?? '任务提交失败', { id: toastId });
        setScenes((prev) => prev.map((s) => s.id === scene.id ? { ...s, status: 'failed' } : s));
        return;
      }

      const { taskId } = genData as { taskId: string };
      // taskId 存入 scene，刷新页面后可恢复轮询
      setScenes((prev) => prev.map((s) => s.id === scene.id ? { ...s, taskId } : s));
      toast.success('任务已提交，等待生成...', { id: toastId });

      startPollingForTask(scene.id, taskId);
    } catch {
      toast.error('网络错误，任务提交失败', { id: toastId });
      setScenes((prev) => prev.map((s) => s.id === scene.id ? { ...s, status: 'failed' } : s));
    }
  }, [stopPolling, setScenes]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 h-12 border-b shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold">🎬 AI 短剧生成工作台</span>
          {projectTitle && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">{projectTitle}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  清空
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>清空当前工作台</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要清空当前所有分镜并开启新项目吗？此操作将永久删除当前页面的数据。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearWorkspace}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator orientation="vertical" className="h-4" />

          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1.5">
            <Settings className="w-4 h-4" />
            设置
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Left */}
        <aside className="w-80 shrink-0 border-r flex flex-col">
          {/* 剧本库入口 */}
          <div className="px-2 pt-2 shrink-0">
            <ProjectLibrary
              projects={projects}
              activeProjectId={activeProjectId}
              onSwitch={handleSwitchProject}
              onDelete={handleDeleteProject}
              onNew={handleNewProject}
            />
          </div>
          <Separator className="mt-2" />

          {/* 角色设定 */}
          <div className="px-3 py-2.5 shrink-0">
            <CharacterPanel
              characters={characters}
              onChange={setCharacters}
            />
          </div>
          <Separator className="shrink-0" />

          <Tabs defaultValue="novel" className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full rounded-none border-b shrink-0 h-10 bg-muted/50">
              <TabsTrigger value="novel" className="flex-1 text-xs">📖 小说智能拆解</TabsTrigger>
              <TabsTrigger value="direct" className="flex-1 text-xs">⚡ 直接写分镜</TabsTrigger>
            </TabsList>
            <TabsContent value="novel" className="flex-1 min-h-0 p-4 mt-0">
              <NovelInput onScenesGenerated={handleScenesGenerated} isGenerating={isAnyGenerating} />
            </TabsContent>
            <TabsContent value="direct" className="flex-1 min-h-0 p-4 mt-0">
              <DirectInput onAddScene={handleAddScene} nextIndex={scenes.length + 1} disabled={isAnyGenerating} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Right */}
        <main className="flex-1 min-w-0 p-4">
          {!isHydrated ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              加载中...
            </div>
          ) : (
            <StoryboardPreview
              scenes={scenes}
              projectTitle={projectTitle}
              onGenerateVideo={handleGenerateVideo}
              onCancelGeneration={handleCancelGeneration}
              onUpdatePrompt={handleUpdatePrompt}
              onMoveUp={handleMoveSceneUp}
              onMoveDown={handleMoveSceneDown}
              onDelete={handleDeleteScene}
              onInsertAfter={handleInsertSceneAfter}
            />
          )}
        </main>
      </div>

      {/* Bottom */}
      <footer className="border-t px-4 py-3 shrink-0 bg-muted/30">
        <VideoProgress scenes={scenes} />
      </footer>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
