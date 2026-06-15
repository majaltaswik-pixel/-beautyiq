import { LangGraphOrchestrator } from '../orchestrator/graph';
import { OrchestratorRouter } from '../orchestrator/router';
import { OrchestratorState, ContextData, ModuleType } from '../orchestrator/state';

describe('Orchestrator Integration', () => {
  let orchestrator: LangGraphOrchestrator;
  let router: OrchestratorRouter;
  let capturedState: OrchestratorState | null;

  const mockTools: any = {
    queryKnowledgeGraph: jest.fn().mockResolvedValue([{ id: 'ing:1', type: 'Ingredient', label: 'Hyaluronic Acid', properties: { benefits: ['hydration'] } }]),
    queryRAG: jest.fn().mockResolvedValue({ vectorResults: [{ id: 'vec:1', text: 'Hyaluronic Acid hydrates skin', score: 0.95 }], graphResults: [] }),
    getRAGContext: jest.fn().mockResolvedValue({ context: 'Hyaluronic Acid is a humectant.', sources: [{ type: 'vector', id: 'vec:1', score: 0.95 }] }),
    getProductById: jest.fn().mockResolvedValue({ id: 'prod:1', title: 'Hydrating Serum', price: 42, ingredients: ['Hyaluronic Acid', 'Vitamin B5'] }),
    getProductsByType: jest.fn().mockResolvedValue([{ id: 'prod:1', title: 'Hydrating Serum', price: 42, productType: 'serum' }]),
    searchProductsByIngredients: jest.fn().mockResolvedValue([]),
    getEventsByCustomer: jest.fn().mockResolvedValue([]),
    emitEvent: jest.fn().mockResolvedValue(undefined),
    getEventHistory: jest.fn().mockResolvedValue([]),
    getSkinProfile: jest.fn().mockResolvedValue({ skinType: 'dry', skinConcerns: ['dehydration'], customerId: 'cust:1' }),
    getNeighbors: jest.fn().mockResolvedValue([{ node: { id: 'ing:2', label: 'Vitamin E' }, edge: { type: 'SYNERGIZES_WITH', weight: 0.9 } }]),
    findGraphPath: jest.fn().mockResolvedValue({ nodes: ['prod:1', 'ing:1'], edges: [{ type: 'CONTAINS', weight: 1.0 }] }),
    findGraphPaths: jest.fn().mockResolvedValue([{ nodes: ['prod:1', 'ing:1'], edges: [] }]),
    traverseGraph: jest.fn().mockResolvedValue([{ node: { id: 'prod:2', label: 'Night Cream' }, edge: { type: 'COMPATIBLE_WITH', weight: 0.8 } }]),
    findSimilar: jest.fn().mockResolvedValue([{ id: 'prod:3', label: 'Rich Moisturizer', score: 0.87 }]),
    getGraphStats: jest.fn().mockResolvedValue({ totalNodes: 30, totalEdges: 45 }),
    getGraphNodesByType: jest.fn().mockImplementation((type: string) => {
      if (type === 'Routine') return Promise.resolve([{ id: 'rt:1', label: 'Dry Skin Routine', properties: { skinTypes: ['dry'], steps: 5 } }]);
      if (type === 'Product') return Promise.resolve([
        { id: 'prod:1', label: 'Hydrating Serum', properties: { price: 42, ingredients: ['Hyaluronic Acid'], productType: 'serum', skinTypes: ['dry'] } },
        { id: 'prod:2', label: 'Rich Moisturizer', properties: { price: 38, ingredients: ['Ceramides'], productType: 'moisturizer', skinTypes: ['dry'] } },
        { id: 'prod:3', label: 'Gentle Cleanser', properties: { price: 24, ingredients: ['Glycerin'], productType: 'cleanser', skinTypes: ['dry', 'sensitive'] } },
      ]);
      return Promise.resolve([]);
    }),
    findIngredientSynergies: jest.fn().mockResolvedValue([{ ingredient: 'Retinol', synergies: ['Hyaluronic Acid'], conflicts: ['Vitamin C'] }]),
  };

  beforeEach(() => {
    capturedState = null;
    router = new OrchestratorRouter();
    orchestrator = new LangGraphOrchestrator(router, mockTools);

    const modules: ModuleType[] = ['recommendation', 'support', 'upsell', 'recovery', 'content', 'analytics', 'fallback'];
    for (const mod of modules) {
      orchestrator.registerModule(mod, async (state) => {
        const newState = { ...state, status: 'completed' as const, action: `${mod}_response`, payload: { handled: true } };
        capturedState = newState;
        return newState;
      });
    }
  });

  describe('process()', () => {
    it('routes a recommendation context to recommendation module', async () => {
      const context: ContextData = {
        skinProfile: { skinType: 'dry', skinConcerns: ['dehydration'] },
        query: 'skincare products for dry skin',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('recommendation');
      expect(capturedState?.status).toBe('completed');
    });

    it('routes a support query to support module', async () => {
      const context: ContextData = {
        query: 'what is retinol?',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('support');
    });

    it('routes an upsell query to upsell module', async () => {
      const context: ContextData = {
        eventType: 'ADD_TO_CART',
        cartId: 'cart:1',
        eventPayload: { line_items: [{ product_id: 'prod:1', title: 'Serum', price: 42 }] },
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('upsell');
    });

    it('routes a recovery context to recovery module', async () => {
      const context: ContextData = {
        eventType: 'ABANDONED_CHECKOUT',
        customerId: 'cust:1',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('recovery');
    });

    it('routes a content generation query to content module', async () => {
      const context: ContextData = {
        query: 'write product description for moisturizer',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('content');
    });

    it('routes an analytics query to analytics module', async () => {
      const context: ContextData = {
        query: 'show me revenue analytics for last 30 days',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('analytics');
    });

    it('falls back when no module matches confidently', async () => {
      const context: ContextData = {
        query: 'hello',
      };
      const result = await orchestrator.process(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('fallback');
    });
  });

  describe('processEvent()', () => {
    it('maps PRODUCT_VIEWED to recommendation module', async () => {
      const context: ContextData = { eventType: 'PRODUCT_VIEWED', productId: 'prod:1' };
      const result = await orchestrator.processEvent(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('recommendation');
    });

    it('maps ADD_TO_CART to upsell module', async () => {
      const context: ContextData = { eventType: 'ADD_TO_CART', cartId: 'cart:1' };
      const result = await orchestrator.processEvent(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('upsell');
    });

    it('maps CHECKOUT_STARTED to upsell module', async () => {
      const context: ContextData = { eventType: 'CHECKOUT_STARTED', cartId: 'cart:1' };
      const result = await orchestrator.processEvent(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('upsell');
    });

    it('maps ABANDONED_CHECKOUT to recovery module', async () => {
      const context: ContextData = { eventType: 'ABANDONED_CHECKOUT', customerId: 'cust:1' };
      const result = await orchestrator.processEvent(context);
      expect(result.status).toBe('completed');
      expect(capturedState?.module).toBe('recovery');
    });
  });

  describe('state management', () => {
    it('preserves context through the pipeline', async () => {
      const context: ContextData = {
        customerId: 'cust:42',
        shopDomain: 'test-shop.myshopify.com',
        sessionId: 'sess:abc',
        skinProfile: { skinType: 'oily', skinConcerns: ['acne'] },
        metadata: { source: 'shopify_webhook' },
      };
      const result = await orchestrator.process(context);
      expect(result.context.customerId).toBe('cust:42');
      expect(result.context.shopDomain).toBe('test-shop.myshopify.com');
      expect(result.context.sessionId).toBe('sess:abc');
      expect(result.context.skinProfile?.skinType).toBe('oily');
    });

    it('accumulates reasoning array', async () => {
      const context: ContextData = { query: 'recommend products for aging skin' };
      const result = await orchestrator.process(context);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning.some((r) => r.toLowerCase().includes('recommendation'))).toBe(true);
    });

    it('records module in sourceModules', async () => {
      const context: ContextData = { eventType: 'ADD_TO_CART', cartId: 'cart:1' };
      const result = await orchestrator.processEvent(context);
      expect(result.sourceModules).toContain('upsell');
    });

    it('returns error status when no handler registered', async () => {
      const emptyOrch = new LangGraphOrchestrator(router, mockTools);
      const context: ContextData = { query: 'recommend products' };
      const result = await emptyOrch.process(context);
      expect(result.status).toBe('error');
      expect(result.error).toContain('No handler');
    });
  });
});
