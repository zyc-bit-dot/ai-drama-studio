'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Scene, AnalyzeResponse } from '@/types';
import { getApiHeaders } from '@/lib/apiKeys';

const PLACEHOLDER = `在此粘贴你的小说片段...

示例：
深夜，林峰从飞机残骸中爬出，四肢百骸如同碎裂。漫天风雪遮住了星光，零下二十度的寒意瞬间刺入骨髓。他知道，这里是西伯利亚腹地，距离最近的人类聚居点至少三百公里。`;

interface Props {
  onScenesGenerated: (scenes: Scene[], title: string) => void;
  isGenerating: boolean;
}

export function NovelInput({ onScenesGenerated, isGenerating }: Props) {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const wordCount = text.trim().length;

  const handleAnalyze = async () => {
    if (wordCount < 10) {
      toast.warning('请至少输入 10 个字');
      return;
    }
    setAnalyzing(true);
    const toastId = toast.loading('AI 正在拆解分镜，请稍候...');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
        body: JSON.stringify({ novelText: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? '分析失败，请重试', { id: toastId });
        return;
      }
      const response = data as AnalyzeResponse;
      onScenesGenerated(response.scenes, response.title);
      toast.success(`拆解完成！共生成 ${response.scenes.length} 个分镜`, { id: toastId });
    } catch {
      toast.error('网络错误，请检查连接后重试', { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-foreground">📖 小说输入</h2>
        <Badge variant="secondary" className="text-xs">{wordCount} 字</Badge>
      </div>

      <Textarea
        className="flex-1 resize-none text-sm leading-relaxed min-h-0"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={analyzing || isGenerating}
      />

      <Button
        className="w-full shrink-0"
        onClick={handleAnalyze}
        disabled={analyzing || isGenerating || wordCount < 10}
      >
        {analyzing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI 拆解分镜中...</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" />AI 智能分镜拆解</>
        )}
      </Button>
    </div>
  );
}
