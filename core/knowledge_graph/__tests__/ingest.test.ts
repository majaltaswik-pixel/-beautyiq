import { KnowledgeGraph } from '../relations';
import { KnowledgeIngestor } from '../ingest';
import { NodeType, EdgeType, ProductIngestionInput, IngredientProfile, RoutineIngestionInput } from '../schema';

describe('KnowledgeIngestor', () => {
  let kg: KnowledgeGraph;
  let ingestor: KnowledgeIngestor;

  beforeEach(() => {
    kg = new KnowledgeGraph();
    ingestor = new KnowledgeIngestor(kg);
  });

  describe('ingestProduct', () => {
    it('ingests a single product with all fields', async () => {
      const input: ProductIngestionInput = {
        shopifyId: 2001, title: 'Test Serum', description: 'A test product',
        ingredients: ['Hyaluronic Acid', 'Vitamin C'],
        skinConcerns: ['Dehydration', 'Dullness'], skinTypes: ['Dry', 'Normal'],
        benefits: ['Hydration', 'Brightening'], productType: 'Serum', brand: 'TestBrand',
        price: 42, tags: ['vegan'], vendor: 'TestVendor', form: 'Liquid',
      };
      const { node, edges } = await ingestor.ingestProduct(input);
      expect(node.type).toBe(NodeType.Product);
      expect(node.label).toBe('Test Serum');
      expect(node.properties.price).toBe(42);
      expect(edges.length).toBeGreaterThan(0);
      const containsEdges = edges.filter((e) => e.type === EdgeType.CONTAINS);
      expect(containsEdges).toHaveLength(2);
    });

    it('ingests product with minimal fields', async () => {
      const input: ProductIngestionInput = {
        shopifyId: 2002, title: 'Minimal Product', description: '', ingredients: [], price: 20,
      };
      const { node, edges } = await ingestor.ingestProduct(input);
      expect(node.label).toBe('Minimal Product');
      expect(edges).toHaveLength(0);
    });

    it('ensures nodes are reusable across products', async () => {
      const p1: ProductIngestionInput = { shopifyId: 3001, title: 'P1', description: '', ingredients: ['Retinol'], price: 30 };
      const p2: ProductIngestionInput = { shopifyId: 3002, title: 'P2', description: '', ingredients: ['Retinol'], price: 40 };
      await ingestor.ingestProduct(p1);
      await ingestor.ingestProduct(p2);
      const ingredients = await kg.getByType(NodeType.Ingredient);
      expect(ingredients).toHaveLength(1);
    });
  });

  describe('ingestProducts (batch)', () => {
    it('ingests multiple products and returns report', async () => {
      const inputs: ProductIngestionInput[] = [
        { shopifyId: 4001, title: 'Product A', description: '', ingredients: ['Vitamin C'], price: 25 },
        { shopifyId: 4002, title: 'Product B', description: '', ingredients: ['Retinol'], price: 35 },
        { shopifyId: 4003, title: 'Product C', description: '', ingredients: [], price: 15 },
      ];
      const report = await ingestor.ingestProducts(inputs);
      expect(report.success).toBe(true);
      expect(report.nodesCreated).toBe(3);
      expect(report.edgesCreated).toBeGreaterThanOrEqual(0);
      const count = await kg.count();
      expect(count.nodes).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ingestIngredient', () => {
    it('ingests ingredient with full profile', async () => {
      const profile: IngredientProfile = {
        name: 'Test Ingredient', description: 'A test ingredient', category: 'Test',
        benefits: ['Hydration'], contraindications: ['Acne'], suitableSkinTypes: ['Dry', 'Normal'],
        compatibleWith: [], incompatibleWith: [], safetyLevel: 'safe',
      };
      const { node, edges } = await ingestor.ingestIngredient(profile);
      expect(node.type).toBe(NodeType.Ingredient);
      expect(node.label).toBe('Test Ingredient');
      expect(node.properties.category).toBe('Test');
      expect(node.properties.safetyLevel).toBe('safe');
      expect(edges.length).toBeGreaterThanOrEqual(2);
    });

    it('ingests ingredient with compatibility edges', async () => {
      await ingestor.ingestIngredient({
        name: 'Ingredient A', description: '', category: '', benefits: [], contraindications: [],
        suitableSkinTypes: [], compatibleWith: [], incompatibleWith: [], safetyLevel: 'safe',
      });
      const profile: IngredientProfile = {
        name: 'Ingredient B', description: '', category: '', benefits: [], contraindications: [],
        suitableSkinTypes: [], compatibleWith: ['Ingredient A'], incompatibleWith: [], safetyLevel: 'safe',
      };
      const { edges } = await ingestor.ingestIngredient(profile);
      const compatEdges = edges.filter((e) => e.type === EdgeType.COMPATIBLE_WITH);
      expect(compatEdges).toHaveLength(1);
    });
  });

  describe('ingestRoutine', () => {
    it('ingests a routine with steps', async () => {
      await ingestor.ingestProduct({ shopifyId: 5001, title: 'Cleanser', description: '', ingredients: [], price: 20 });
      const input: RoutineIngestionInput = {
        name: 'Test Routine', skinTypes: ['Normal'], concerns: ['Hydration'],
        steps: [
          { productId: 'product:5001', stepNumber: 1, name: 'Cleanse', description: 'First step', timeOfDay: 'morning' },
        ],
      };
      const { node, edges } = await ingestor.ingestRoutine(input);
      expect(node.type).toBe(NodeType.Routine);
      expect(node.label).toBe('Test Routine');
      expect(node.properties.totalSteps).toBe(1);
    });

    it('creates FOLLOWED_BY edges between sequential steps', async () => {
      await ingestor.ingestProduct({ shopifyId: 6001, title: 'Step1', description: '', ingredients: [], price: 10 });
      await ingestor.ingestProduct({ shopifyId: 6002, title: 'Step2', description: '', ingredients: [], price: 10 });
      const input: RoutineIngestionInput = {
        name: 'Two-Step Routine', steps: [
          { productId: 'product:6001', stepNumber: 1, name: 'First', description: '', timeOfDay: 'both' },
          { productId: 'product:6002', stepNumber: 2, name: 'Second', description: '', timeOfDay: 'both' },
        ],
      };
      const { edges } = await ingestor.ingestRoutine(input);
      const followedBy = edges.filter((e) => e.type === EdgeType.FOLLOWED_BY);
      expect(followedBy.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('importFromJSON (bulk)', () => {
    it('imports products, ingredients, and routines from JSON', async () => {
      const data = {
        products: [{ shopifyId: 7001, title: 'Bulk Product', description: '', ingredients: ['Retinol'], price: 50 }],
        ingredients: [{ name: 'Retinol', description: '', category: '', benefits: ['Anti-Aging'], contraindications: [], suitableSkinTypes: [], compatibleWith: [], incompatibleWith: [], safetyLevel: 'safe' as const }],
        routines: [{ name: 'Bulk Routine', steps: [{ productId: 'product:7001', stepNumber: 1, name: 'Step 1', description: '', timeOfDay: 'both' as const }] }],
      };
      const report = await ingestor.importFromJSON(data);
      expect(report.products.success).toBe(true);
      expect(report.products.nodesCreated).toBe(1);
      const count = await kg.count();
      expect(count.nodes).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Progress callback', () => {
    it('calls progress callback during batch import', async () => {
      const progressCalls: Array<{ current: number; total: number; label: string }> = [];
      ingestor.onProgress((c, t, l) => progressCalls.push({ current: c, total: t, label: l }));
      await ingestor.ingestProducts([
        { shopifyId: 8001, title: 'A', description: '', ingredients: [], price: 10 },
        { shopifyId: 8002, title: 'B', description: '', ingredients: [], price: 10 },
      ]);
      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0].current).toBe(1);
      expect(progressCalls[0].total).toBe(2);
    });
  });
});
