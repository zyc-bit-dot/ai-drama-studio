'use client';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Scene } from '@/types';

/**
 * 将所有已完成视频打包为 ZIP 下载
 * 视频通过服务端代理抓取，绕过 CORS 限制
 */
export async function exportZip(
  scenes: Scene[],
  projectTitle: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const completed = scenes.filter((s) => s.status === 'completed' && s.videoUrl);
  if (completed.length === 0) throw new Error('没有已完成的视频可以下载');

  const zip = new JSZip();
  const folderName = (projectTitle || '短剧项目').replace(/[/\\?%*:|"<>]/g, '_');
  const folder = zip.folder(folderName) ?? zip;

  for (let i = 0; i < completed.length; i++) {
    const scene = completed[i];
    const pad = String(i + 1).padStart(2, '0');
    const safeName = (scene.title || '分镜').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${pad}_${safeName}.mp4`;

    // 直接在浏览器端请求可灵 CDN（用户在中国大陆可直连；服务端代理因 IP 限制会 403）
    const res = await fetch(scene.videoUrl!, { mode: 'cors' });
    if (!res.ok) throw new Error(`下载 "${filename}" 失败（${res.status}）`);

    folder.file(filename, await res.blob());
    onProgress?.(i + 1, completed.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
}

/**
 * 导出剧本文本文件（分镜描述 + 提示词）
 */
export function exportScript(scenes: Scene[], projectTitle: string): void {
  const title = projectTitle || '未命名项目';
  const lines: string[] = [
    `# ${title}`,
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    `共 ${scenes.length} 个分镜`,
    '',
    '---',
    '',
  ];

  scenes.forEach((scene, idx) => {
    lines.push(`## 分镜 ${idx + 1}：${scene.title || '(未命名)'}`);
    lines.push(`题材：${scene.genre}`);
    if (scene.description) {
      lines.push('');
      lines.push('场景描述：');
      lines.push(scene.description);
    }
    lines.push('');
    lines.push('AI 提示词（Prompt）：');
    lines.push(scene.prompt || '（未填写）');
    if (scene.videoUrl) {
      lines.push('');
      lines.push(`视频链接：${scene.videoUrl}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${title}_剧本.txt`);
}
