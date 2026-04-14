/**
 * Web Crypto API 实现的 HS256 JWT 签名
 * 兼容 Vercel Edge Runtime（不依赖 Node.js crypto 或 jsonwebtoken）
 */

function base64url(data: Uint8Array | string): string {
  const bytes =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function signKlingJWT(
  accessKey: string,
  secretKey: string
): Promise<string> {
  const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800,
      nbf: Math.floor(Date.now() / 1000) - 5,
    })
  );
  const message = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  const sig = base64url(new Uint8Array(sigBytes));

  return `${message}.${sig}`;
}
