import { LangGraphOrchestrator } from './core/orchestrator/graph';
import { OrchestratorRouter } from './core/orchestrator/router';
import { createOrchestratorTools } from './core/orchestrator/tools';
import { KnowledgeGraph } from './core/knowledge_graph/relations';
import { RAGSystem, RAGConfig } from './core/rag/index';
import { EventBus, globalEventBus } from './core/events/event_bus';
import { EventIngestor } from './core/events/ingestor';
import { ProductSyncService } from './core/shopify/sync_products';
import { ProductRepository } from './core/db/products';
import { KnowledgeIngestor } from './core/knowledge_graph/ingest';
import { SEED_INGREDIENTS, SEED_PRODUCTS, SEED_ROUTINES } from './core/knowledge_graph/seed';
import { DEFAULT_SUPPORT_KNOWLEDGE } from './modules/support/rag_support';
import { recommendationHandler } from './modules/recommendation/service';
import { supportHandler } from './modules/support/service';
import { upsellHandler } from './modules/upsell/service';
import { recoveryHandler } from './modules/recovery/service';
import { contentHandler } from './modules/content/generator';
import { analyticsHandler } from './modules/analytics/tracker';
import { ShopifyClient } from './core/shopify/client';
import { WebhookHandler } from './core/shopify/webhooks';
import { handleRecommend } from './api/routes/recommend';
import { handleSupport } from './api/routes/support';
import { handleUpsell } from './api/routes/upsell';
import { handleRecovery } from './api/routes/recovery';
import { handleAnalytics } from './api/routes/analytics';
import pg from 'pg';

export interface BeautyIQConfig {
  shopify: {
    apiKey: string;
    clientSecret: string;
    scopes: string;
    redirectUri: string;
  };
  rag: RAGConfig;
  db: any;
  seedKnowledgeGraph?: boolean;
  server?: {
    port: number;
    host: string;
  };
}

export class BeautyIQRevenueSystem {
  public orchestrator: LangGraphOrchestrator;
  public eventBus: EventBus;
  public eventIngestor: EventIngestor;
  public knowledgeGraph: KnowledgeGraph;
  public ragSystem: RAGSystem;
  public productRepo: ProductRepository;
  public productSync: ProductSyncService;
  public knowledgeIngestor: KnowledgeIngestor;
  public webhookHandler: WebhookHandler;
  private config: BeautyIQConfig;

  constructor(config: BeautyIQConfig) {
    this.config = config;
    this.eventBus = globalEventBus;
    this.knowledgeGraph = new KnowledgeGraph();
    this.ragSystem = new RAGSystem(config.rag, this.knowledgeGraph);
    this.productRepo = new ProductRepository(config.db);
    this.eventIngestor = new EventIngestor({
      eventBus: this.eventBus,
      db: { saveEvent: async (e) => console.log('[Event Persisted]', `${e.type} | ${e.entity}:${e.entityId}`) },
    });
    this.webhookHandler = new WebhookHandler(config.shopify.clientSecret, this.eventBus);
    const tools = createOrchestratorTools(this.ragSystem, this.knowledgeGraph, this.eventBus, this.productRepo);
    const router = new OrchestratorRouter();
    this.orchestrator = new LangGraphOrchestrator(router, tools);

    this.registerModules();
    const shopifyClient = new ShopifyClient('');
    this.productSync = new ProductSyncService(shopifyClient, this.productRepo);
    this.knowledgeIngestor = new KnowledgeIngestor(this.knowledgeGraph);
  }

  private registerModules(): void {
    this.orchestrator.registerModule('recommendation', recommendationHandler);
    this.orchestrator.registerModule('support', supportHandler);
    this.orchestrator.registerModule('upsell', upsellHandler);
    this.orchestrator.registerModule('recovery', recoveryHandler);
    this.orchestrator.registerModule('content', contentHandler);
    this.orchestrator.registerModule('analytics', analyticsHandler);
  }

  async initialize(): Promise<void> {
    await this.ragSystem.initialize();
    await this.seedSupportRAG();
    if (this.config.seedKnowledgeGraph !== false) {
      await this.seedKnowledgeGraph();
    }
  }

  private async seedSupportRAG(): Promise<void> {
    console.log('[BeautyIQ] Seeding support knowledge into RAG...');
    for (const doc of DEFAULT_SUPPORT_KNOWLEDGE) {
      if (doc.type === 'faq') {
        await this.ragSystem.ingestFAQ({ question: doc.title, answer: doc.content, category: doc.category });
      } else {
        await this.ragSystem.retriever.ingest([{
          id: doc.id,
          text: `${doc.title}: ${doc.content}`,
          metadata: { type: doc.type, category: doc.category, tags: doc.tags },
        }]);
      }
    }
    console.log(`[BeautyIQ] Seeded ${DEFAULT_SUPPORT_KNOWLEDGE.length} support documents into RAG`);
  }

  private async seedKnowledgeGraph(): Promise<void> {
    console.log('[BeautyIQ] Seeding knowledge graph...');
    this.knowledgeIngestor.onProgress((c, t, l) => {
      if (c % 5 === 0 || c === t) {
        console.log(`[BeautyIQ] KG seed: ${c}/${t} — ${l}`);
      }
    });
    const ingReport = await this.knowledgeIngestor.ingestIngredients(SEED_INGREDIENTS);
    console.log(`[BeautyIQ] Seeded ${ingReport.nodesCreated} ingredients with ${ingReport.edgesCreated} edges`);
    const prodReport = await this.knowledgeIngestor.ingestProducts(SEED_PRODUCTS);
    console.log(`[BeautyIQ] Seeded ${prodReport.nodesCreated} products with ${prodReport.edgesCreated} edges`);
    for (const routine of SEED_ROUTINES) {
      await this.knowledgeIngestor.ingestRoutine(routine);
    }
    const stats = await this.knowledgeGraph.stats();
    console.log(`[BeautyIQ] Knowledge Graph ready: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
  }

  async syncShopProducts(shopDomain: string): Promise<{ total: number; errors: number }> {
    const client = new ShopifyClient(shopDomain);
    const syncer = new ProductSyncService(client, this.productRepo);
    const result = await syncer.syncAll();
    console.log(`[BeautyIQ] Synced ${result.totalProcessed} products for ${shopDomain} (${result.totalCreated} new, ${result.totalUpdated} updated)`);
    return { total: result.totalProcessed, errors: result.totalErrors };
  }

  async handleRequest(endpoint: string, body: any): Promise<any> {
    switch (endpoint) {
      case '/recommend': return handleRecommend(body, this.orchestrator);
      case '/support': return handleSupport(body, this.orchestrator);
      case '/upsell': return handleUpsell(body, this.orchestrator);
      case '/recover-cart': return handleRecovery(body, this.orchestrator);
      case '/analytics': return handleAnalytics(body, this.orchestrator);
      default: return { error: 'Unknown endpoint', status: 404 };
    }
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: process.env.DOTENV_PATH || undefined });

      const { BeautyIQServer } = await import('./api/server');

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'beautyiq_dev',
        user: process.env.DB_USER || 'beautyiq',
        password: process.env.DB_PASSWORD || 'Vakli+Jlinanco7@/39+01',
      };
      const pool = new pg.Pool(dbConfig);
      try {
        await pool.query('SELECT 1');
        console.log('[BeautyIQ] PostgreSQL connected');
        try {
          const { readFileSync } = await import('fs');
          const { join } = await import('path');
          const migrationPath = join(__dirname, '..', 'infra', 'migrations', '001_initial_schema.sql');
          const sql = readFileSync(migrationPath, 'utf8');
          await pool.query(sql);
          console.log('[BeautyIQ] Migrations applied');
        } catch (mErr: any) {
          console.log('[BeautyIQ] Migration skipped:', mErr.message);
        }
      } catch (dbErr) {
        console.warn('[BeautyIQ] PostgreSQL not available — running in degraded mode');
      }

      const config: BeautyIQConfig = {
        shopify: {
          apiKey: (process.env.SHOPIFY_API_KEY || '').trim(),
          clientSecret: (process.env.SHOPIFY_CLIENT_SECRET || '').trim(),
          scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').trim(),
          redirectUri: (process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/auth/callback').trim(),
        },
        rag: {
          embeddingApiKey: process.env.EMBEDDING_API_KEY,
          embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'mock') as 'openai' | 'cohere' | 'groq' | 'mock',
          embeddingModel: process.env.EMBEDDING_MODEL,
        },
        db: pool,
        seedKnowledgeGraph: process.env.SEED_KG !== 'false',
        server: {
          port: parseInt(process.env.PORT || '3000', 10),
          host: process.env.HOST || '0.0.0.0',
        },
      };

      const system = new BeautyIQRevenueSystem(config);
      await system.initialize();

      const server = new BeautyIQServer(system, config.server?.port || 3000, config.shopify);
      await server.start();

      console.log(`[BeautyIQ] System ready — listening on port ${config.server?.port || 3000}`);
    } catch (err) {
      console.error('[BeautyIQ] Failed to start:', err);
      process.exit(1);
    }
  })();
}

export { LangGraphOrchestrator } from './core/orchestrator/graph';
export { OrchestratorRouter } from './core/orchestrator/router';
export { KnowledgeGraph } from './core/knowledge_graph/relations';
export { RAGSystem } from './core/rag/index';
export { EventBus, globalEventBus } from './core/events/event_bus';
export { EventIngestor } from './core/events/ingestor';
export { SEED_INGREDIENTS, SEED_PRODUCTS, SEED_ROUTINES } from './core/knowledge_graph/seed';
