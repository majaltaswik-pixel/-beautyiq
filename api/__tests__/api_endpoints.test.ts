import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { OrchestratorRouter } from '../../core/orchestrator/router';
import { ContextData, OrchestratorState } from '../../core/orchestrator/state';
import { handleRecommend } from '../routes/recommend';
import { handleSupport } from '../routes/support';
import { handleUpsell } from '../routes/upsell';
import { handleRecovery } from '../routes/recovery';
import { handleAnalytics } from '../routes/analytics';
import { handleProducts } from '../routes/products';
import { handleRecommendations, handleRoutineRecommendation } from '../routes/recommendations';
import { handleRoutines, handleRoutineSteps } from '../routes/routines';

describe('API Endpoints Integration', () => {
  let orchestrator: LangGraphOrchestrator;
  let capturedContext: ContextData | null;

  const mockTools: any = {
    queryRAG: jest.fn().mockResolvedValue({ vectorResults: [], graphResults: [] }),
    getRAGContext: jest.fn().mockResolvedValue({ context: '', sources: [] }),
    queryKnowledgeGraph: jest.fn().mockResolvedValue([]),
    getGraphNodesByType: jest.fn().mockResolvedValue([]),
    getGraphStats: jest.fn().mockResolvedValue({ totalNodes: 1, totalEdges: 1 }),
    getProductById: jest.fn().mockResolvedValue(null),
    getProductsByType: jest.fn().mockResolvedValue([]),
    searchProductsByIngredients: jest.fn().mockResolvedValue([]),
    getEventsByCustomer: jest.fn().mockResolvedValue([]),
    emitEvent: jest.fn(),
    getEventHistory: jest.fn().mockResolvedValue([]),
    getSkinProfile: jest.fn().mockResolvedValue({}),
    getNeighbors: jest.fn().mockResolvedValue([]),
    findGraphPath: jest.fn().mockResolvedValue(null),
    findGraphPaths: jest.fn().mockResolvedValue([]),
    traverseGraph: jest.fn().mockResolvedValue([]),
    findSimilar: jest.fn().mockResolvedValue([]),
    findIngredientSynergies: jest.fn().mockResolvedValue([]),
  };

  const dummyHandler = async (state: OrchestratorState) => ({
    ...state,
    status: 'completed' as const,
    action: 'handled',
    payload: { success: true, originalContext: state.context },
  });

  beforeEach(() => {
    capturedContext = null;
    const router = new OrchestratorRouter();
    orchestrator = new LangGraphOrchestrator(router, mockTools);

    const originalProcess = orchestrator.process.bind(orchestrator);
    jest.spyOn(orchestrator, 'process').mockImplementation(async (ctx: ContextData) => {
      capturedContext = ctx;
      return originalProcess(ctx);
    });

    orchestrator.registerModule('recommendation', dummyHandler);
    orchestrator.registerModule('support', dummyHandler);
    orchestrator.registerModule('upsell', dummyHandler);
    orchestrator.registerModule('recovery', dummyHandler);
    orchestrator.registerModule('analytics', dummyHandler);
  });

  describe('POST /recommend', () => {
    it('builds context with skin profile', async () => {
      const body = { skinType: 'dry', skinConcerns: ['dehydration'], allergies: ['retinol'], age: 30, customerId: 'cust:1', shopDomain: 'test.myshopify.com' };
      const result = await handleRecommend(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.skinProfile?.skinType).toBe('dry');
      expect(capturedContext?.skinProfile?.skinConcerns).toEqual(['dehydration']);
      expect(capturedContext?.skinProfile?.allergies).toEqual(['retinol']);
      expect(capturedContext?.customerId).toBe('cust:1');
    });

    it('passes through metadata', async () => {
      const body = { skinType: 'oily', metadata: { source: 'widget', sessionId: 'sess:1' } };
      await handleRecommend(body, orchestrator);
      expect(capturedContext?.metadata?.source).toBe('widget');
    });
  });

  describe('POST /support', () => {
    it('builds context with query and customer info', async () => {
      const body = { query: 'what is retinol?', customerId: 'cust:1', orderId: 'ord:1' };
      const result = await handleSupport(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.query).toBe('what is retinol?');
      expect(capturedContext?.customerId).toBe('cust:1');
      expect(capturedContext?.orderId).toBe('ord:1');
    });
  });

  describe('POST /upsell', () => {
    it('builds context from cart data', async () => {
      const body = { customerId: 'cust:1', cartId: 'cart:1', cartItems: [{ product_id: 'prod:1', title: 'Serum', price: 42 }], total: 42, eventType: 'CHECKOUT_STARTED' };
      const result = await handleUpsell(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.cartId).toBe('cart:1');
      expect(capturedContext?.eventType).toBe('CHECKOUT_STARTED');
    });
  });

  describe('POST /recover-cart', () => {
    it('builds recovery context from checkout data', async () => {
      const body = { customerId: 'cust:1', cartId: 'cart:1', cartItems: [{ product_id: 'prod:1', title: 'Serum', price: 42, quantity: 1 }], totalPrice: 42, checkoutId: 'ch:1', cartToken: 'tok:1', shopDomain: 'test.myshopify.com' };
      const result = await handleRecovery(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.eventType).toBe('ABANDONED_CHECKOUT');
      expect(capturedContext?.eventPayload?.line_items).toHaveLength(1);
      expect(capturedContext?.eventPayload?.total_price).toBe(42);
    });
  });

  describe('POST /analytics', () => {
    it('builds analytics context with date range', async () => {
      const body = { shopDomain: 'test.myshopify.com', dateRange: '90d', metrics: ['revenue', 'conversion'], sessionId: 'sess:1' };
      const result = await handleAnalytics(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.metadata?.dateRange).toBe('90d');
      expect(capturedContext?.shopDomain).toBe('test.myshopify.com');
    });
  });

  describe('POST /recommendations', () => {
    it('builds recommendation context with full skin profile', async () => {
      const body = { skinType: 'combination', skinConcerns: ['aging', 'texture'], allergies: [], count: 10, includeRoutine: true, customerId: 'cust:1' };
      const result = await handleRecommendations(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.skinProfile?.skinType).toBe('combination');
      expect(capturedContext?.skinProfile?.skinConcerns).toEqual(['aging', 'texture']);
      expect(capturedContext?.metadata?.count).toBe(10);
    });
  });

  describe('POST /recommendations/routine', () => {
    it('builds routine context with timeOfDay', async () => {
      const body = { skinType: 'dry', timeOfDay: 'AM', routineLength: 5, customerId: 'cust:1' };
      const result = await handleRoutineRecommendation(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.metadata?.timeOfDay).toBe('AM');
    });
  });

  describe('GET /products', () => {
    it('sets default action as list', async () => {
      const body = { shopDomain: 'test.myshopify.com', filters: { type: 'serum' } };
      const result = await handleProducts(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.metadata?.action).toBe('list');
      expect(capturedContext?.metadata?.filters?.type).toBe('serum');
    });
  });

  describe('GET /routines', () => {
    it('builds routine context with skin type', async () => {
      const body = { skinType: 'oily', skinConcerns: ['acne'], customerId: 'cust:1' };
      const result = await handleRoutines(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.skinProfile?.skinType).toBe('oily');
      expect(capturedContext?.skinProfile?.skinConcerns).toEqual(['acne']);
    });
  });

  describe('GET /routines/:id/steps', () => {
    it('builds steps context with routine ID', async () => {
      const body = { routineId: 'rt:1', productDetails: true };
      const result = await handleRoutineSteps(body, orchestrator);
      expect(result.status).toBe('completed');
      expect(capturedContext?.metadata?.routineId).toBe('rt:1');
    });
  });

  describe('Full API → Orchestrator flow', () => {
    it('complete recommend → process → response cycle returns correct shape', async () => {
      const body = { skinType: 'normal', skinConcerns: ['dullness'], sessionId: 'sess:1', shopDomain: 'test.myshopify.com' };
      const result = await handleRecommend(body, orchestrator);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('payload');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('completed');
    });

    it('routes different endpoints to different modules', async () => {
      await handleRecommend({ skinType: 'dry' }, orchestrator);
      const recModule = capturedContext?.query?.includes('skincare products');

      await handleSupport({ query: 'help' }, orchestrator);
      expect(capturedContext?.query).toBe('help');

      await handleAnalytics({}, orchestrator);
      expect(capturedContext?.query).toBe('revenue analytics');
    });
  });
});
