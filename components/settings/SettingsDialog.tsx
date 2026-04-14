'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { saveApiKeys, getStoredApiKeys, maskTail, maskMiddle } from '@/lib/apiKeys';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SecretInput({
  value,
  onChange,
  placeholder,
  alwaysHidden = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  alwaysHidden?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show && !alwaysHidden ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      {!alwaysHidden && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ has, maskedValue }: { has: boolean; maskedValue: string }) {
  return (
    <Badge variant={has ? 'default' : 'secondary'} className="text-xs flex items-center gap-1">
      {has ? (
        <><CheckCircle2 className="w-3 h-3" />已配置 {maskedValue}</>
      ) : (
        <><XCircle className="w-3 h-3" />未配置</>
      )}
    </Badge>
  );
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const [deepseekKey,    setDeepseekKey]    = useState('');
  const [klingAccessKey, setKlingAccessKey] = useState('');
  const [klingSecretKey, setKlingSecretKey] = useState('');
  const [saved,  setSaved]  = useState(false);
  const [stored, setStored] = useState({ deepseekKey: '', klingAccessKey: '', klingSecretKey: '' });

  useEffect(() => {
    if (!open) return;
    // Load current values from localStorage to show status badges
    setStored(getStoredApiKeys());
    setDeepseekKey('');
    setKlingAccessKey('');
    setKlingSecretKey('');
    setSaved(false);
  }, [open]);

  const handleSave = () => {
    saveApiKeys({ deepseekKey, klingAccessKey, klingSecretKey });
    // Refresh stored values for badge display
    setStored(getStoredApiKeys());
    setDeepseekKey('');
    setKlingAccessKey('');
    setKlingSecretKey('');
    setSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>⚙️ API 密钥设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── DeepSeek ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">DeepSeek API Key</label>
              <StatusBadge
                has={stored.deepseekKey.length > 0}
                maskedValue={maskTail(stored.deepseekKey)}
              />
            </div>
            <SecretInput
              value={deepseekKey}
              onChange={setDeepseekKey}
              placeholder="输入新 Key 以覆盖（留空则保留原值）"
            />
          </div>

          <Separator />

          {/* ── 可灵 Kling ── */}
          <div className="space-y-3">
            <p className="text-sm font-medium">可灵 (Kling) — 企业级双密钥</p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Access Key</label>
                <StatusBadge
                  has={stored.klingAccessKey.length > 0}
                  maskedValue={maskMiddle(stored.klingAccessKey)}
                />
              </div>
              <SecretInput
                value={klingAccessKey}
                onChange={setKlingAccessKey}
                placeholder="输入 Access Key（留空则保留原值）"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Secret Key</label>
                <StatusBadge
                  has={stored.klingSecretKey.length > 0}
                  maskedValue={maskTail(stored.klingSecretKey)}
                />
              </div>
              <SecretInput
                value={klingSecretKey}
                onChange={setKlingSecretKey}
                placeholder="输入 Secret Key（留空则保留原值）"
                alwaysHidden
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            密钥仅保存在您的浏览器本地存储中，不会上传至服务器。
          </p>

          {saved && (
            <p className="text-sm font-medium text-green-600">保存成功</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
