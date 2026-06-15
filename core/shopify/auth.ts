import crypto from 'crypto';

export interface ShopifyToken {
  accessToken: string;
  scope: string;
  expiresIn: number;
  associatedUserScope?: string;
}

export interface Session {
  shop: string;
  accessToken: string;
  expiresAt: Date | null;
}

const SESSION_STORE = new Map<string, Session>();

export function generateAuthUrl(shop: string, apiKey: string, scopes: string, redirectUri: string): string {
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  return `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`;
}

export function validateHmac(queryString: string, clientSecret: string): boolean {
  const qs = new URLSearchParams(queryString);
  const hmac = qs.get('hmac');
  if (!hmac) return false;
  qs.delete('hmac');
  const sorted = [...qs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&');
  const expected = crypto.createHmac('sha256', clientSecret).update(sorted).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
}

export async function exchangeAccessToken(shop: string, code: string, apiKey: string, clientSecret: string): Promise<ShopifyToken> {
  const resp = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: apiKey, client_secret: clientSecret, code }),
  });
  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.statusText}`);
  return resp.json() as Promise<ShopifyToken>;
}

export function storeSession(shop: string, accessToken: string, expiresIn: number | null): void {
  SESSION_STORE.set(shop, {
    shop,
    accessToken,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
  });
}

export function getSession(shop: string): Session | undefined {
  const session = SESSION_STORE.get(shop);
  if (!session) return undefined;
  if (session.expiresAt && session.expiresAt < new Date()) {
    SESSION_STORE.delete(shop);
    return undefined;
  }
  return session;
}

export function verifyWebhook(body: string, hmacHeader: string, clientSecret: string): boolean {
  const hash = crypto.createHmac('sha256', clientSecret).update(body, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}
