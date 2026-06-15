import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { OrchestratorRouter } from '../../core/orchestrator/router';
import { OrchestratorState, ContextData } from '../../core/orchestrator/state';
import { KnowledgeGraph } from '../../core/knowledge_graph/relations';
import { NodeType } from '../../core/knowledge_graph/schema';
import { recommendationHandler } from '../recommendation/service';
import { supportHandler } from '../support/service';
import { upsellHandler } from '../upsell/service';
import { recoveryHandler } from '../recovery/service';

function createKG(): KnowledgeGraph {
  const kg = new KnowledgeGraph();
  kg.addNode({ id: 'ing:HA', type: NodeType.Ingredient, label: 'Hyaluronic Acid', properties: { category: 'humectant', benefits: ['hydration'], skinTypes: ['dry', 'normal', 'sensitive', 'oily', 'combination'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'ing:VitC', type: NodeType.Ingredient, label: 'Vitamin C', properties: { category: 'antioxidant', benefits: ['brightening'], skinTypes: ['normal', 'oily'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'ing:Ret', type: NodeType.Ingredient, label: 'Retinol', properties: { category: 'active', benefits: ['aging'], skinTypes: ['normal', 'oily', 'combination'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'ing:Nia', type: NodeType.Ingredient, label: 'Niacinamide', properties: { category: 'vitamin', benefits: ['pores', 'texture'], skinTypes: ['oily', 'combination', 'normal'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'prod:1', type: NodeType.Product, label: 'Hydrating Serum', properties: { price: 42, ingredients: ['Hyaluronic Acid', 'Vitamin B5'], productType: 'serum', tags: ['hydration', 'dry skin'], skinTypes: ['dry', 'normal'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'prod:2', type: NodeType.Product, label: 'Brightening Serum', properties: { price: 48, ingredients: ['Vitamin C', 'Vitamin E'], productType: 'serum', tags: ['brightening', 'hyperpigmentation'], skinTypes: ['normal', 'oily'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'prod:3', type: NodeType.Product, label: 'Gentle Cleanser', properties: { price: 22, ingredients: ['Glycerin'], productType: 'cleanser', tags: ['gentle', 'dry skin'], skinTypes: ['dry', 'sensitive', 'normal'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'prod:4', type: NodeType.Product, label: 'Rich Moisturizer', properties: { price: 36, ingredients: ['Ceramides', 'Shea Butter'], productType: 'moisturizer', tags: ['hydration', 'barrier'], skinTypes: ['dry', 'sensitive'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'prod:5', type: NodeType.Product, label: 'SPF 40', properties: { price: 28, ingredients: ['Zinc Oxide'], productType: 'sunscreen', tags: ['spf', 'protection'], skinTypes: ['dry', 'normal', 'oily', 'sensitive', 'combination'] }, createdAt: '', updatedAt: '' });
  kg.addNode({ id: 'rt:1', type: NodeType.Routine, label: 'Dry Skin Routine', properties: { skinTypes: ['dry'], steps: 5 }, createdAt: '', updatedAt: '' });
  return kg;
}

function createMockTools(kg: KnowledgeGraph) {
  const productRepo = {
    findById: (id: string) => {
      const map: Record<string, any> = {
        'prod:1': { id: 'prod:1', title: 'Hydrating Serum', price: 42, ingredients: ['Hyaluronic Acid', 'Vitamin B5'], productType: 'serum', tags: ['hydration'] },
        'prod:2': { id: 'prod:2', title: 'Brightening Serum', price: 48, ingredients: ['Vitamin C', 'Vitamin E'], productType: 'serum', tags: ['brightening'] },
        'prod:3': { id: 'prod:3', title: 'Gentle Cleanser', price: 22, ingredients: ['Glycerin'], productType: 'cleanser', tags: ['gentle'] },
      };
      return map[id] || null;
    },
    findByShopifyId: () => null,
    searchByType: (type: string) => [],
    searchByIngredients: () => [],
  };

  return {
    kg,
    queryKnowledgeGraph: (query: string, topK = 10) => kg.semanticQuery({ text: query, topK }),
    queryRAG: () => Promise.resolve({ vectorResults: [], graphResults: [] }),
    getRAGContext: () => Promise.resolve({ context: '', sources: [] }),
    getProductById: (id: string) => Promise.resolve(productRepo.findById(id)),
    getProductsByType: (type: string) => Promise.resolve([]),
    searchProductsByIngredients: () => Promise.resolve([]),
    getEventsByCustomer: () => Promise.resolve([]),
    emitEvent: () => Promise.resolve(),
    getEventHistory: () => Promise.resolve([]),
    getSkinProfile: () => Promise.resolve({ skinType: 'dry', skinConcerns: ['dehydration'] }),
    getNeighbors: (nodeId: string) => kg.getNeighbors(nodeId),
    findGraphPath: (startId: string, endId: string, maxDepth = 5) => kg.findPath(startId, endId, maxDepth),
    findGraphPaths: (startId: string, endId: string, maxResults = 5) => kg.findPaths(startId, endId, maxResults),
    traverseGraph: (startId: string, edgeTypes: any[], maxDepth: number, direction?: any) => kg.traverse(startId, { edgeTypes, maxDepth, direction: direction || 'both' }),
    findSimilar: (nodeId: string, topK = 5) => kg.findSimilar(nodeId, topK),
    getGraphStats: () => kg.stats(),
    getGraphNodesByType: (type: string) => kg.getByType(type as NodeType),
    findIngredientSynergies: (ingredients: string[]) => Promise.resolve([]),
  };
}

describe('Module Integration — Full Pipeline', () => {
  let kg: KnowledgeGraph;
  let tools: any;
  let orchestrator: LangGraphOrchestrator;

  beforeAll(async () => {
    kg = createKG();
    tools = createMockTools(kg);
    const router = new OrchestratorRouter();
    orchestrator = new LangGraphOrchestrator(router, tools);
    orchestrator.registerModule('recommendation', recommendationHandler);
    orchestrator.registerModule('support', supportHandler);
    orchestrator.registerModule('upsell', upsellHandler);
    orchestrator.registerModule('recovery', recoveryHandler);
  });

  describe('Recommendation → KG integration', () => {
    it('returns recommendations with reasoning', async () => {
      const state: ContextData = {
        skinProfile: { skinType: 'dry', skinConcerns: ['dehydration'] },
        query: 'recommend products for dry dehydrated skin',
      };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.recommendations).toBeDefined();
      expect(Array.isArray(result.payload.recommendations)).toBe(true);
      if (result.payload.recommendations.length > 0) {
        expect(result.payload.recommendations[0].score).toBeGreaterThan(0);
      }
    });

    it('includes routine steps in recommendation output', async () => {
      const state: ContextData = {
        skinProfile: { skinType: 'dry', skinConcerns: ['dehydration'] },
        query: 'build a routine for dry skin',
      };
      const result = await orchestrator.process(state);
      expect(result.payload.routine).toBeDefined();
      expect(Array.isArray(result.payload.routine)).toBe(true);
    });

    it('generates explanation text', async () => {
      const state: ContextData = {
        skinProfile: { skinType: 'combination', skinConcerns: ['aging'] },
        query: 'anti-aging products',
      };
      const result = await orchestrator.process(state);
      expect(result.payload.explanation).toBeDefined();
      expect(typeof result.payload.explanation).toBe('string');
      expect(result.payload.explanation.length).toBeGreaterThan(0);
    });
  });

  describe('Support → Knowledge integration', () => {
    it('classifies intent and returns a response', async () => {
      const state: ContextData = { query: 'what is retinol?' };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.intent).toBeDefined();
      expect(result.payload.response).toBeDefined();
    });

    it('responds to order tracking queries', async () => {
      const state: ContextData = { query: 'where is my order?', orderId: 'ord:1' };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.intent).toBe('order_tracking');
    });

    it('responds to return policy queries', async () => {
      const state: ContextData = { query: 'how do I return a product?' };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.intent).toBe('returns');
    });

    it('returns follow-up suggestions', async () => {
      const state: ContextData = { query: 'shipping times' };
      const result = await orchestrator.process(state);
      expect(result.payload.suggestions).toBeDefined();
      expect(Array.isArray(result.payload.suggestions)).toBe(true);
    });
  });

  describe('Upsell → Graph integration', () => {
    it('generates upsell offers from cart contents', async () => {
      const state: ContextData = {
        eventType: 'ADD_TO_CART',
        cartId: 'cart:1',
        eventPayload: {
          line_items: [{ product_id: 'prod:1', title: 'Hydrating Serum', price: 42 }],
        },
      };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.complementaryProducts).toBeDefined();
      expect(result.payload.bundles).toBeDefined();
    });

    it('suggests routine completions for missing steps', async () => {
      const state: ContextData = {
        eventType: 'ADD_TO_CART',
        eventPayload: { line_items: [{ product_id: 'prod:3', title: 'Gentle Cleanser', price: 22 }] },
        metadata: { cartItems: [{ product_id: 'prod:3', title: 'Gentle Cleanser', price: 22 }] },
      };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.routineCompletions).toBeDefined();
    });
  });

  describe('Recovery pipeline', () => {
    it('processes abandoned checkout with alternatives', async () => {
      const state: ContextData = {
        eventType: 'ABANDONED_CHECKOUT',
        shopDomain: 'test.myshopify.com',
        eventPayload: {
          line_items: [{ product_id: 'prod:1', title: 'Hydrating Serum', price: 42, quantity: 1 }],
          total_price: 42,
        },
      };
      const result = await orchestrator.process(state);
      expect(result.status).toBe('completed');
      expect(result.payload.abandonedCart).toBeDefined();
      expect(result.payload.channels).toBeDefined();
    });
  });

  describe('Cross-module data consistency', () => {
    it('all modules produce the standard output shape', async () => {
      const inputs: ContextData[] = [
        { skinProfile: { skinType: 'dry' }, query: 'recommend' },
        { query: 'what is hyaluronic acid?' },
        { eventType: 'ADD_TO_CART', eventPayload: { line_items: [{ product_id: 'prod:1', title: 'Test', price: 10 }] } },
        { eventType: 'ABANDONED_CHECKOUT', eventPayload: { line_items: [] } },
      ];
      for (const input of inputs) {
        const result = await orchestrator.process(input);
        expect(result.status).toBe('completed');
        expect(result.action).toBeDefined();
        expect(result.payload).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.reasoning)).toBe(true);
      }
    });
  });
});
