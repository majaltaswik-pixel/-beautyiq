import { QueryEngine } from '../queries/engine';
import { InMemoryGraphStorage } from '../adapters/storage';
import { NodeType, EdgeType, TraversalRule } from '../schema';

describe('QueryEngine', () => {
  let storage: InMemoryGraphStorage;
  let engine: QueryEngine;

  beforeEach(async () => {
    storage = new InMemoryGraphStorage();
    engine = new QueryEngine(storage);
    await storage.addNodes([
      { id: 'prod:1', type: NodeType.Product, label: 'Hydrating Serum', properties: { price: 42, productType: 'Serum', tags: ['hydration', 'vitamin c', 'serum'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'prod:2', type: NodeType.Product, label: 'Retinol Serum', properties: { price: 58, productType: 'Serum', tags: ['anti-aging', 'night', 'serum'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'prod:3', type: NodeType.Product, label: 'SPF 40', properties: { price: 26, productType: 'SPF', tags: ['sun', 'protection'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'ing:1', type: NodeType.Ingredient, label: 'Hyaluronic Acid', properties: { category: 'Humectant', safety: 'safe' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'ing:2', type: NodeType.Ingredient, label: 'Retinol', properties: { category: 'Retinoid', safety: 'caution' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'sc:1', type: NodeType.SkinConcern, label: 'Aging', properties: { severity: 'moderate' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'sc:2', type: NodeType.SkinConcern, label: 'Acne', properties: { severity: 'high' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'st:1', type: NodeType.SkinType, label: 'Dry', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ]);
    await storage.addEdges([
      { id: 'e1', source: 'prod:1', target: 'ing:1', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
      { id: 'e2', source: 'prod:2', target: 'ing:2', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
      { id: 'e3', source: 'ing:2', target: 'sc:1', type: EdgeType.TREATS, weight: 0.9, properties: {}, createdAt: '2024-01-01' },
      { id: 'e4', source: 'prod:1', target: 'st:1', type: EdgeType.SUITABLE_FOR, weight: 0.8, properties: {}, createdAt: '2024-01-01' },
      { id: 'e5', source: 'ing:1', target: 'ing:2', type: EdgeType.COMPATIBLE_WITH, weight: 0.7, properties: {}, createdAt: '2024-01-01' },
    ]);
  });

  describe('search', () => {
    it('returns all matching nodes', async () => {
      const results = await engine.search({ nodeType: NodeType.Product });
      expect(results).toHaveLength(3);
    });

    it('filters by label', async () => {
      const results = await engine.search({ labels: ['hydrating'] });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prod:1');
    });

    it('filters by property', async () => {
      const results = await engine.search({ nodeType: NodeType.Ingredient, properties: { safety: 'safe' } });
      expect(results).toHaveLength(1);
    });

    it('sorts by property', async () => {
      const results = await engine.search({ nodeType: NodeType.Product, sortBy: 'price', sortDirection: 'desc' });
      expect(results[0].id).toBe('prod:2');
      expect(results[0].properties.price).toBe(58);
    });
  });

  describe('semanticSearch', () => {
    it('finds nodes by text relevance', async () => {
      const results = await engine.semanticSearch({ text: 'Aging', topK: 5 });
      expect(results.length).toBeGreaterThanOrEqual(2);
      const labels = results.map((r) => r.label);
      expect(labels).toContain('Aging');
    });

    it('filters by node types', async () => {
      const results = await engine.semanticSearch({ text: 'Acne', nodeTypes: [NodeType.SkinConcern], topK: 5 });
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('Acne');
    });

    it('respects minScore', async () => {
      const results = await engine.semanticSearch({ text: 'zzz_nonexistent', minScore: 0.5 });
      expect(results).toHaveLength(0);
    });
  });

  describe('findPath', () => {
    it('finds path from product to concern via ingredient', async () => {
      const path = await engine.findPath('prod:2', 'sc:1');
      expect(path).not.toBeNull();
      expect(path!.nodes.map((n) => n.id)).toEqual(['prod:2', 'ing:2', 'sc:1']);
    });

    it('returns null for unreachable nodes', async () => {
      await storage.addNode({ id: 'iso', type: NodeType.Benefit, label: 'Isolated', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      const path = await engine.findPath('prod:1', 'iso');
      expect(path).toBeNull();
    });

    it('handles self-path', async () => {
      const path = await engine.findPath('prod:1', 'prod:1');
      expect(path).not.toBeNull();
      expect(path!.nodes).toHaveLength(1);
    });

    it('respects max depth', async () => {
      const path = await engine.findPath('prod:2', 'sc:1', 1);
      expect(path).toBeNull();
    });
  });

  describe('findPaths (multiple)', () => {
    it('finds at least one path', async () => {
      const paths = await engine.findPaths('prod:2', 'sc:1', 5);
      expect(paths.length).toBeGreaterThanOrEqual(1);
      expect(paths[0].nodes[0].id).toBe('prod:2');
    });
  });

  describe('traverse', () => {
    it('traverses outbound edges with filter', async () => {
      const rule: TraversalRule = { edgeTypes: [EdgeType.CONTAINS], maxDepth: 1, direction: 'outbound' };
      const results = await engine.traverse('prod:1', rule);
      expect(results).toHaveLength(1);
      expect(results[0].node.id).toBe('ing:1');
    });

    it('supports both directions', async () => {
      const rule: TraversalRule = { edgeTypes: [EdgeType.CONTAINS], maxDepth: 1, direction: 'both' };
      const results = await engine.traverse('ing:1', rule);
      expect(results).toHaveLength(1);
    });

    it('filters by minimum weight', async () => {
      const rule: TraversalRule = { edgeTypes: [EdgeType.COMPATIBLE_WITH], maxDepth: 1, direction: 'both', minEdgeWeight: 0.8 };
      const results = await engine.traverse('ing:1', rule);
      expect(results).toHaveLength(0);
    });
  });

  describe('getNeighbors', () => {
    it('returns all neighbors', async () => {
      const neighbors = await engine.getNeighbors('ing:2');
      expect(neighbors).toHaveLength(3);
    });

    it('filters by edge type', async () => {
      const neighbors = await engine.getNeighbors('ing:2', EdgeType.TREATS);
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].node.id).toBe('sc:1');
    });
  });

  describe('findSimilar', () => {
    it('finds similar by type and tags', async () => {
      const similar = await engine.findSimilar('prod:1', 5);
      expect(similar.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty for singleton type', async () => {
      await storage.addNode({ id: 'only', type: NodeType.Brand, label: 'Solo', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      const similar = await engine.findSimilar('only', 5);
      expect(similar).toHaveLength(0);
    });
  });
});
