import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { BeautyIQRevenueSystem } from '../main';
import { authMiddleware } from './middleware/auth';
import { validateMiddleware } from './middleware/validate';
import { handleRecommend } from './routes/recommend';
import { handleSupport } from './routes/support';
import { handleUpsell } from './routes/upsell';
import { handleRecovery } from './routes/recovery';
import { handleAnalytics } from './routes/analytics';
import { handleProducts, handleProductSync } from './routes/products';
import { handleRecommendations, handleRoutineRecommendation } from './routes/recommendations';
import { handleRoutines, handleRoutineSteps } from './routes/routines';
import { handleIngestEvent } from './routes/ingest_event';
import { handleCreateCheckout, handleWebhook, handleCreatePortal, handleGetPlans } from './routes/billing';
import { validateHmac, exchangeAccessToken, storeSession } from '../core/shopify/auth';
import { ShopifyClient } from '../core/shopify/client';
import path from 'path';
import fs from 'fs';

export class BeautyIQServer {
  private app: express.Application;
  private system: BeautyIQRevenueSystem;
  private port: number;
  private shopifyConfig: { apiKey: string; clientSecret: string; scopes: string; redirectUri: string };

  constructor(
    system: BeautyIQRevenueSystem,
    port = 3000,
    shopifyConfig?: { apiKey: string; clientSecret: string; scopes: string; redirectUri: string }
  ) {
    this.system = system;
    this.port = port;
    this.shopifyConfig = shopifyConfig || { apiKey: '', clientSecret: '', scopes: '', redirectUri: '' };
    this.app = express();
    this.configure();
    this.routes();
  }

  private configure(): void {
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
        frameguard: false,
      })
    );
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.use(morgan('dev'));

    // Stripe webhook requires raw body â€” must be before JSON parser
    this.app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes(): void {
    // Landing page (public) â€” __dirname = dist/api/, remonter Ã  la racine
    const frontendPath = path.join(__dirname, '..', '..', 'frontend');
    const distPath = path.join(frontendPath, 'dist');
    const landingPath = path.join(frontendPath, 'landing.html');

    this.app.get('/', (_req: Request, res: Response) => {
      if (fs.existsSync(landingPath)) {
        res.sendFile(landingPath);
      } else {
        res.send('<h1>BeautyIQ Revenue System</h1><p>Please install the app from your Shopify admin.</p>');
      }
    });

    // Plans & Checkout API (public â€” pour la landing page)
    this.app.get('/api/v1/billing/plans', handleGetPlans);
    this.app.post('/api/v1/billing/create-checkout', handleCreateCheckout);

    // Servir l'app React embarquÃ©e (buildÃ©e dans frontend/dist)
    if (fs.existsSync(distPath)) {
      this.app.use('/app', express.static(distPath));
      this.app.get('/app/*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    this.app.get('/auth/callback', this.asyncHandlerAuth(async (req: Request) => {
      const { code, hmac, shop, host } = req.query as Record<string, string>;
      if (!code || !hmac || !shop) {
        return { redirect: '/' };
      }
      const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
      if (!validateHmac(qs, this.shopifyConfig.clientSecret)) {
        throw new Error('HMAC validation failed');
      }
      const raw: any = await exchangeAccessToken(shop, code, this.shopifyConfig.apiKey, this.shopifyConfig.clientSecret);
      storeSession(shop, raw.access_token, raw.expires_in);

      // Trigger product sync in background
      this.system.syncShopProducts(shop).catch((e) =>
        console.warn(`[Sync] Background sync for ${shop} failed:`, e.message)
      );

      return { redirect: `/app?shop=${shop}&host=${host || ''}` };
    }));

    // Install endpoint
    this.app.get('/auth/install', (req: Request, res: Response) => {
      const { shop } = req.query as Record<string, string>;
      if (!shop) return res.status(400).send('Missing shop parameter');
      // generateAuthUrl is re-exported by core/shopify/auth; kept inline here if needed.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { generateAuthUrl } = require('../core/shopify/auth');
      const url = generateAuthUrl(shop, this.shopifyConfig.apiKey, this.shopifyConfig.scopes, this.shopifyConfig.redirectUri);
      res.redirect(url);
    });

    // Widget embed script
    const widgetPath = path.join(__dirname, '..', '..', 'public', 'widget.js');
    if (fs.existsSync(widgetPath)) {
      this.app.get('/widget.js', (_req: Request, res: Response) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.type('application/javascript').sendFile(widgetPath);
      });
    }

    // Public widget API (no auth â€” used from storefront)
    this.app.post('/widget/recommend', async (req: Request, res: Response) => {
      try {
        const result = await handleRecommend(req.body, this.system.orchestrator);

        // Expected storefront shape:
        // { payload: { explanation, recommendations: [{ product: { title, price, imageUrl }, match }], routine: [] } }
        const payload = (result && (result.payload || result)) as any;

        const recommendationsRaw = payload?.recommendations || payload?.products || [];
        const normalized = {
          payload: {
            explanation: payload?.explanation ?? payload?.reasoning?.[1] ?? payload?.reasoning?.[0] ?? '',
            recommendations: (Array.isArray(recommendationsRaw) ? recommendationsRaw : []).map((r: any) => {
              const product = r?.product || r || {};
              return {
                product: {
                  title: product?.title ?? product?.name ?? '',
                  price: product?.price ?? product?.compare_at_price ?? product?.cost ?? null,
                  imageUrl: product?.imageUrl ?? product?.image_url ?? product?.image ?? '',
                },
                match: r?.match ?? r?.score ?? r?.similarity ?? 0,
              };
            }),
            routine: payload?.routine ?? [],
          },
        };

        // If orchestrator already matches expected keys, keep original.
        if (payload?.explanation !== undefined && payload?.recommendations !== undefined && payload?.routine !== undefined) {
          res.json(result);
        } else {
          res.json(normalized);
        }
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Widget install/status (auth-protected)
    const WIDGET_SRC = 'https://www.beautyiqapp.com/widget.js?shop=';

    this.app.get('/api/v1/widget/status', authMiddleware, async (req: Request, res: Response) => {
      try {
        const shop = (req.query.shop || req.body.shop) as string;
        if (!shop) return res.status(400).json({ error: 'Missing shop' });
        const client = new ShopifyClient(shop);
        const tags = await client.getScriptTags();
        const installed = (tags.script_tags || []).some((t: any) => t.src.startsWith('https://www.beautyiqapp.com/widget.js'));
        res.json({ installed });
      } catch (err: any) {
        res.json({ installed: false, error: err.message });
      }
    });

    this.app.post('/api/v1/widget/install', authMiddleware, async (req: Request, res: Response) => {
      try {
        const shop = (req.query.shop || req.body.shop) as string;
        if (!shop) return res.status(400).json({ error: 'Missing shop' });

        const client = new ShopifyClient(shop);
        const tags = await client.getScriptTags();
        const existing = (tags.script_tags || []).find((t: any) => t.src.startsWith('https://www.beautyiqapp.com/widget.js'));

        if (existing) {
          await client.deleteScriptTag(existing.id);
        }

        // delete then recreate on each install
        const src = WIDGET_SRC + encodeURIComponent(shop) + '&v=' + Date.now();
        const result = await client.createScriptTag(src, 'online_store');

        res.json({ installed: true, id: result.script_tag?.id, message: 'Widget installed successfully' });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Legacy API routes (the built frontend calls /api/... without /v1/)
    this.app.post('/api/recommend', authMiddleware, async (req: Request, res: Response) => {
      try {
        const result = await handleRecommend({ ...req.body, ...req.query, ...req.params }, this.system.orchestrator);
        res.status(200).json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    this.app.get('/api/shop', authMiddleware, async (req: Request, res: Response) => {
      res.json({ shop: req.query.shop, name: req.query.shop, status: 'active' });
    });

    const api = express.Router();

    api.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
    });

    api.use(authMiddleware);
    api.post('/billing/customer-portal', handleCreatePortal);

    api.post('/recommend', this.asyncHandler(handleRecommend));
    api.post('/support', validateMiddleware(['query']), this.asyncHandler(handleSupport));
    api.post('/upsell', this.asyncHandler(handleUpsell));
    api.post('/recover-cart', this.asyncHandler(handleRecovery));
    api.post('/analytics', this.asyncHandler(handleAnalytics));

    api.post('/ingest-event', async (req, res, next) => {
      try {
        const result = await handleIngestEvent({ ...req.body }, this.system.eventIngestor);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    });

    api.get('/products', this.asyncHandler(handleProducts));
    api.post('/products/sync', this.asyncHandler(handleProductSync));
    api.post('/recommendations', this.asyncHandler(handleRecommendations));
    api.post('/recommendations/routine', this.asyncHandler(handleRoutineRecommendation));
    api.get('/routines', this.asyncHandler(handleRoutines));
    api.get('/routines/:id/steps', this.asyncHandler(handleRoutineSteps));

    this.app.use('/api/v1', api);

    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found', status: 404 });
    });

    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[Server Error]', err.message, err.stack);
      res.status(500).json({ error: err.message || 'Internal server error', status: 500 });
    });
  }

  private asyncHandler(fn: (body: any, orchestrator: any) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = { ...req.body, ...req.query, ...req.params };
        const result = await fn(body, this.system.orchestrator);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    };
  }

  private asyncHandlerAuth(fn: (req: Request) => Promise<{ redirect?: string }>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await fn(req);
        res.redirect(result.redirect || '/');
      } catch (err) {
        next(err);
      }
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`[BeautyIQ Server] Running on port ${this.port}`);
        resolve();
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}

