import { EventBus, globalEventBus } from '../events/event_bus';
import { EventIngestor } from '../events/ingestor';
import { NormalizedEvent, EventType } from '../events/types';
import { LangGraphOrchestrator } from '../orchestrator/graph';
import { OrchestratorRouter } from '../orchestrator/router';

describe('Shopify → Event → Orchestrator Pipeline', () => {
  let eventBus: EventBus;
  let ingestor: EventIngestor;
  let capturedEvents: NormalizedEvent[];

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
    getEventHistory: jest.fn().mockImplementation(() => [...capturedEvents]),
    getSkinProfile: jest.fn().mockResolvedValue({}),
    getNeighbors: jest.fn().mockResolvedValue([]),
    findGraphPath: jest.fn().mockResolvedValue(null),
    findGraphPaths: jest.fn().mockResolvedValue([]),
    traverseGraph: jest.fn().mockResolvedValue([]),
    findSimilar: jest.fn().mockResolvedValue([]),
    findIngredientSynergies: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    capturedEvents = [];
    eventBus = new EventBus();
    ingestor = new EventIngestor({
      eventBus,
      db: { saveEvent: async (e: NormalizedEvent) => { capturedEvents.push(e); } },
    });
  });

  describe('Event Ingestion', () => {
    it('ingests a Shopify products/create webhook', async () => {
      const payload = { id: 123456, title: 'Hydrating Serum', product_type: 'serum', variants: [{ price: '42.00' }] };
      await ingestor.ingestShopifyWebhook('products/create', payload);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('PRODUCT_CREATED');
      expect(history[0].entity).toBe('product');
      expect(history[0].entityId).toBe('123456');
    });

    it('ingests a Shopify orders/create webhook', async () => {
      const payload = { id: 78901, customer: { id: 555 }, total_price: '85.00', line_items: [{ title: 'Serum', price: '42.00' }] };
      await ingestor.ingestShopifyWebhook('orders/create', payload);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('PURCHASE_COMPLETED');
      expect(history[0].customerId).toBe('555');
      expect(history[0].sessionId).toBeUndefined();
    });

    it('ingests a Shopify carts/create webhook', async () => {
      const payload = { id: 'cart_abc123', token: 'tok_xyz', line_items: [{ product_id: 111, title: 'Cleanser' }] };
      await ingestor.ingestShopifyWebhook('carts/create', payload);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('ADD_TO_CART');
      expect(history[0].data.cartToken).toBe('tok_xyz');
    });

    it('ingests a Shopify checkout/create webhook', async () => {
      const payload = { id: 'ch_abc', token: 'tok_check', total_price: '65.00', line_items: [] };
      await ingestor.ingestShopifyWebhook('checkouts/create', payload);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('CHECKOUT_STARTED');
      expect(history[0].data.cartToken).toBe('tok_check');
    });

    it('ingests a Shopify customers/create webhook', async () => {
      const payload = { id: 444, email: 'test@example.com', first_name: 'Jane', last_name: 'Doe' };
      await ingestor.ingestShopifyWebhook('customers/create', payload);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('CUSTOMER_CREATED');
      expect(history[0].data.email).toBe('test@example.com');
    });

    it('ingests a custom event', async () => {
      await ingestor.ingestCustomEvent('RECOMMENDATION_CLICKED', { productId: 'prod:1' }, 'cust:1', 'sess:1');

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('RECOMMENDATION_CLICKED');
      expect(history[0].customerId).toBe('cust:1');
      expect(history[0].sessionId).toBe('sess:1');
    });

    it('persists events to database', async () => {
      await ingestor.ingestCustomEvent('SESSION_STARTED', {});
      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].type).toBe('SESSION_STARTED');
    });
  });

  describe('Event → Orchestrator Routing', () => {
    let orchestrator: LangGraphOrchestrator;
    let lastModule: string | null;

    beforeEach(() => {
      lastModule = null;
      const router = new OrchestratorRouter();
      orchestrator = new LangGraphOrchestrator(router, mockTools);
      const modules: ModuleType[] = ['recommendation', 'support', 'upsell', 'recovery', 'content', 'analytics'];
      for (const mod of modules) {
        orchestrator.registerModule(mod, async (state) => {
          lastModule = state.module;
          return { ...state, status: 'completed' as const };
        });
      }
    });

    it('routes PRODUCT_VIEWED event to recommendation via processEvent', async () => {
      const event: NormalizedEvent = {
        type: 'PRODUCT_VIEWED', source: 'shopify', entity: 'product', entityId: '123',
        data: {}, raw: {}, timestamp: new Date().toISOString(), customerId: 'cust:1',
      };
      await eventBus.emit(event);
      await orchestrator.processEvent({ eventType: 'PRODUCT_VIEWED', productId: '123', customerId: 'cust:1' });
      expect(lastModule).toBe('recommendation');
    });

    it('routes ADD_TO_CART event to upsell via processEvent', async () => {
      await orchestrator.processEvent({ eventType: 'ADD_TO_CART', cartId: 'cart:1' });
      expect(lastModule).toBe('upsell');
    });

    it('routes ABANDONED_CHECKOUT event to recovery via processEvent', async () => {
      await orchestrator.processEvent({ eventType: 'ABANDONED_CHECKOUT', customerId: 'cust:1' });
      expect(lastModule).toBe('recovery');
    });

    it('routes PURCHASE_COMPLETED event to analytics via processEvent', async () => {
      await orchestrator.processEvent({ eventType: 'PURCHASE_COMPLETED', customerId: 'cust:1' });
      expect(lastModule).toBe('analytics');
    });
  });

  describe('Event Bus', () => {
    it('emits and receives events via handler', async () => {
      const handler = jest.fn();
      eventBus.on('PRODUCT_CREATED', handler);

      await ingestor.ingestShopifyWebhook('products/create', { id: 1, title: 'Test' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('PRODUCT_CREATED');
    });

    it('supports batch events', async () => {
      const events: NormalizedEvent[] = [
        { type: 'SESSION_STARTED', source: 'test', entity: 'session', entityId: '1', data: {}, raw: {}, timestamp: new Date().toISOString() },
        { type: 'PRODUCT_VIEWED', source: 'test', entity: 'product', entityId: '2', data: {}, raw: {}, timestamp: new Date().toISOString() },
      ];
      await eventBus.emitBatch(events);
      expect(eventBus.getHistory()).toHaveLength(2);
    });

    it('filters history by type', async () => {
      await ingestor.ingestShopifyWebhook('products/create', { id: 1, title: 'A' });
      await ingestor.ingestShopifyWebhook('orders/create', { id: 2, total_price: '10', customer: { id: 1 } });
      await ingestor.ingestShopifyWebhook('products/create', { id: 3, title: 'B' });

      const productEvents = eventBus.getHistory('PRODUCT_CREATED');
      expect(productEvents).toHaveLength(2);
    });

    it('tracks history with timestamps', async () => {
      await ingestor.ingestCustomEvent('SESSION_STARTED', {});
      const history = eventBus.getHistory();
      expect(history[0].timestamp).toBeDefined();
      expect(new Date(history[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});

import { ModuleType } from '../orchestrator/state';
