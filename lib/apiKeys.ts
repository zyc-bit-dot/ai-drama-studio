// Client-side API key helpers — reads/writes to localStorage (browser only)

const KEY_DEEPSEEK  = 'drama-studio-deepseek-key';
const KEY_KLING_AK  = 'drama-studio-kling-access-key';
const KEY_KLING_SK  = 'drama-studio-kling-secret-key';

export function saveApiKeys(opts: {
  deepseekKey?: string;
  klingAccessKey?: string;
  klingSecretKey?: string;
}) {
  if (opts.deepseekKey)    localStorage.setItem(KEY_DEEPSEEK, opts.deepseekKey);
  if (opts.klingAccessKey) localStorage.setItem(KEY_KLING_AK, opts.klingAccessKey);
  if (opts.klingSecretKey) localStorage.setItem(KEY_KLING_SK, opts.klingSecretKey);
}

export function getStoredApiKeys() {
  if (typeof window === 'undefined') {
    return { deepseekKey: '', klingAccessKey: '', klingSecretKey: '' };
  }
  return {
    deepseekKey:    localStorage.getItem(KEY_DEEPSEEK)  ?? '',
    klingAccessKey: localStorage.getItem(KEY_KLING_AK)  ?? '',
    klingSecretKey: localStorage.getItem(KEY_KLING_SK)  ?? '',
  };
}

/** Merge API key headers into a fetch HeadersInit object */
export function getApiHeaders(): Record<string, string> {
  const { deepseekKey, klingAccessKey, klingSecretKey } = getStoredApiKeys();
  const h: Record<string, string> = {};
  if (deepseekKey)    h['X-Deepseek-Key']  = deepseekKey;
  if (klingAccessKey) h['X-Kling-Access']  = klingAccessKey;
  if (klingSecretKey) h['X-Kling-Secret']  = klingSecretKey;
  return h;
}

// ── Client-side masking (keeps last 4 chars) ────────────────────────
export function maskTail(key: string): string {
  if (!key) return '';
  if (key.length < 4) return '****';
  return '****' + key.slice(-4);
}

export function maskMiddle(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return maskTail(key);
  return key.slice(0, 4) + '****' + key.slice(-4);
}
