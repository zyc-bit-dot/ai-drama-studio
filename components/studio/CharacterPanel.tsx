'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRound, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { CharacterProfile } from '@/types';

interface Props {
  characters: CharacterProfile[];
  onChange: (characters: CharacterProfile[]) => void;
}

interface EditState {
  id: string | null; // null = 新建
  name: string;
  description: string;
}

export function CharacterPanel({ characters, onChange }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);

  const startNew = () =>
    setEditing({ id: null, name: '', description: '' });

  const startEdit = (c: CharacterProfile) =>
    setEditing({ id: c.id, name: c.name, description: c.description });

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing) return;
    const name = editing.name.trim();
    const description = editing.description.trim();
    if (!description) return;

    if (editing.id === null) {
      // 新建
      const newChar: CharacterProfile = {
        id: `char-${Date.now()}`,
        name: name || '未命名角色',
        description,
        enabled: true,
      };
      onChange([...characters, newChar]);
    } else {
      // 编辑
      onChange(
        characters.map((c) =>
          c.id === editing.id ? { ...c, name: name || '未命名角色', description } : c
        )
      );
    }
    setEditing(null);
  };

  const toggleEnabled = (id: string) =>
    onChange(characters.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));

  const deleteChar = (id: string) =>
    onChange(characters.filter((c) => c.id !== id));

  return (
    <div className="space-y-2">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <UserRound className="w-3.5 h-3.5" />
          角色设定
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={startNew}
            title="添加角色"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* 角色列表 */}
      {characters.length === 0 && !editing && (
        <p className="text-xs text-muted-foreground px-0.5">
          添加角色后，外貌描述会自动追加到每条提示词，提升人物一致性。
        </p>
      )}

      {characters.map((c) => (
        <div key={c.id} className="border rounded-md px-2.5 py-2 space-y-1 bg-muted/30">
          <div className="flex items-center gap-1.5">
            {/* 启用开关 */}
            <button
              type="button"
              onClick={() => toggleEnabled(c.id)}
              className={`w-7 h-4 rounded-full transition-colors shrink-0 ${
                c.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              title={c.enabled ? '已启用（点击关闭）' : '已关闭（点击开启）'}
            >
              <span
                className={`block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${
                  c.enabled ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-xs font-medium flex-1 truncate ${
                c.enabled ? '' : 'text-muted-foreground line-through'
              }`}
            >
              {c.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={() => startEdit(c)}
              title="编辑"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 hover:text-destructive"
              onClick={() => deleteChar(c.id)}
              title="删除"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          {c.enabled && (
            <p className="text-xs text-muted-foreground line-clamp-2 pl-9">
              {c.description}
            </p>
          )}
        </div>
      ))}

      {/* 编辑 / 新建表单 */}
      {editing && (
        <div className="border rounded-md p-2.5 space-y-2 bg-background">
          <Input
            placeholder="角色名（如：主角李明）"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="h-7 text-xs"
          />
          <Textarea
            placeholder={`外貌描述，建议用英文写以获得最佳效果。\n例：Asian male, 30s, short black hair, sharp jawline, navy blue suit, 175cm tall`}
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="text-xs resize-none min-h-[80px]"
          />
          <div className="flex gap-1.5 justify-end">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={cancelEdit}>
              <X className="w-3 h-3 mr-1" />取消
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={saveEdit}
              disabled={!editing.description.trim()}
            >
              <Check className="w-3 h-3 mr-1" />保存
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
