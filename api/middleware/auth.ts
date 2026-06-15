import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthConfig {
  shopifyApiSecret?: string;
  apiKey?: string;
  bypassAuth?: boolean;
}

const defaultConfig: AuthConfig = {
  shopifyApiSecret: process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_API_SECRET || '',
  apiKey: process.env.SHOPIFY_API_KEY || '',
  bypassAuth: process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true' || false,
};

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (defaultConfig.bypassAuth) {
    return next();
  }

  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const shopDomain = req.headers['x-shopify-shop-domain'] as string;
  const accessToken = req.headers['authorization']?.replace('Bearer ', '');

  if (req.path === '/api/v1/health') {
    return next();
  }

  if (hmac && shopDomain) {
    const isValid = verifyWebhookHMAC(req.body, hmac, defaultConfig.shopifyApiSecret || '');
    if (isValid) {
      (req as any).shopDomain = shopDomain;
      return next();
    }
  }

  if (accessToken) {
    (req as any).accessToken = accessToken;
    return next();
  }

  if (req.query?.shop && req.query?.timestamp) {
    const shop = req.query.shop as string;
    (req as any).shopDomain = shop;
    return next();
  }

  res.status(401).json({ error: 'Unauthorized - valid Shopify credentials required', status: 401 });
}

export function verifyWebhookHMAC(body: any, hmac: string, secret: string): boolean {
  try {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const computedHash = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
    if (computedHash.length !== hmac.length) return false;
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(hmac));
  } catch {
    return false;
  }
}

export function setAuthConfig(config: Partial<AuthConfig>): void {
  Object.assign(defaultConfig, config);
}
