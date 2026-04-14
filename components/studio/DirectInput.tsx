'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { Scene } from '@/types';
import { GENRE_OPTIONS } from '@/lib/genres';

interface Props {
  onAddScene: (scene: Scene) => void;
  nextIndex: number;
  disabled: boolean;
}

export function DirectInput({ onAddScene, nextIndex, disabled }: Props) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState(GENRE_OPTIONS[0].value);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (prompt.trim().length < 5) {
      setError('请至少输入 5 个字的提示词');
      return;
    }
    setError('');

    const genreOption = GENRE_OPTIONS.find((g) => g.value === genre)!;
    const newScene: Scene = {
      id: `scene-direct-${Date.now()}`,
      index: nextIndex,
      title: `分镜 ${nextIndex}`,
      description: prompt.trim().slice(0, 60) + (prompt.trim().length > 60 ? '...' : ''),
      prompt: prompt.trim(),
      genre,
      status: 'idle',
      progress: 0,
    };
    onAddScene(newScene);
    setPrompt('');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="shrink-0">
        <h2 className="text-sm font-semibold text-foreground mb-1">⚡ 直接写分镜</h2>
        <p className="text-xs text-muted-foreground">
          直接输入单个画面的提示词，立即生成一张分镜卡片。
        </p>
      </div>

      {/* Genre selector */}
      <div className="shrink-0 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">题材 / Genre</label>
        <div className="grid grid-cols-2 gap-1.5">
          {GENRE_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGenre(g.value)}
              className={`text-xs px-2 py-1.5 rounded-md border transition-colors text-left ${
                genre === g.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt textarea */}
      <Textarea
        className="flex-1 resize-none text-sm leading-relaxed min-h-0"
        placeholder={`描述这个画面...\n\n例：主角站在霓虹闪烁的东京街头，大雨倾盆，她打开了那封三年前就该拆的信。`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={disabled}
      />

      {error && <p className="text-xs text-destructive shrink-0">{error}</p>}

      <Button
        className="w-full shrink-0"
        onClick={handleAdd}
        disabled={disabled || prompt.trim().length < 5}
      >
        <Plus className="w-4 h-4 mr-2" />
        添加到分镜板
      </Button>
    </div>
  );
}
