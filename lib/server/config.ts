// 服务端专用：API Key 加密存储
// 使用 Node.js 内置 crypto（AES-256-CBC）
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 生产环境替换为 process.env.SERVER_ENCRYPT_SECRET
const SECRET = process.env.SERVER_ENCRYPT_SECRET ?? 'ai-drama-studio-secret-key-32ch!!';
const KEY = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes
const DATA_FILE = path.join(process.cwd(), 'data', 'config.json');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const [ivHex, encHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

interface StoredConfig {
  deepseekKey?: string;      // 加密后的值
  klingAccessKey?: string;   // 可灵 Access Key（加密）
  klingSecretKey?: string;   // 可灵 Secret Key（加密）
}

export function saveConfig(config: {
  deepseekKey?: string;
  klingAccessKey?: string;
  klingSecretKey?: string;
}) {
  ensureDataDir();
  const existing = loadRawConfig();
  const updated: StoredConfig = { ...existing };
  if (config.deepseekKey !== undefined && config.deepseekKey !== '') {
    updated.deepseekKey = encrypt(config.deepseekKey);
  }
  if (config.klingAccessKey !== undefined && config.klingAccessKey !== '') {
    updated.klingAccessKey = encrypt(config.klingAccessKey);
  }
  if (config.klingSecretKey !== undefined && config.klingSecretKey !== '') {
    updated.klingSecretKey = encrypt(config.klingSecretKey);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf8');
}

function loadRawConfig(): StoredConfig {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function getDecryptedConfig(): {
  deepseekKey: string;
  klingAccessKey: string;
  klingSecretKey: string;
} {
  const raw = loadRawConfig();
  return {
    deepseekKey: raw.deepseekKey ? decrypt(raw.deepseekKey) : '',
    klingAccessKey: raw.klingAccessKey ? decrypt(raw.klingAccessKey) : '',
    klingSecretKey: raw.klingSecretKey ? decrypt(raw.klingSecretKey) : '',
  };
}

// 脱敏：保留后4位
function maskTail(key: string): string {
  if (!key || key.length < 4) return key ? '****' : '';
  return '****' + key.slice(-4);
}

// 脱敏：保留前4位 + 后4位（Access Key 可读性更高）
function maskMiddle(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return maskTail(key);
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export function getMaskedConfig() {
  const decrypted = getDecryptedConfig();
  return {
    deepseekKey: maskTail(decrypted.deepseekKey),
    klingAccessKey: maskMiddle(decrypted.klingAccessKey),
    klingSecretKey: maskTail(decrypted.klingSecretKey),
    hasDeepseekKey: decrypted.deepseekKey.length > 0,
    hasKlingAccessKey: decrypted.klingAccessKey.length > 0,
    hasKlingSecretKey: decrypted.klingSecretKey.length > 0,
  };
}
