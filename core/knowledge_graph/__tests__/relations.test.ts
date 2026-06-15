import { KnowledgeGraph } from '../relations';
import { NodeType, EdgeType } from '../schema';

describe('KnowledgeGraph', () => {
  let kg: KnowledgeGraph;

  beforeEach(() => {
    kg = new KnowledgeGraph();
  });

  describe('Node operations', () => {
    it('adds and retrieves a node', async () => {
      const node = { id: 'test:1', type: NodeType.Ingredient, label: 'Retinol', properties: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await kg.addNode(node);
      const result = await kg.getNode('test:1');
      expect(result).toBeDefined();
      expect(result!.label).toBe('Retinol');
      expect(result!.type).toBe(NodeType.Ingredient);
    });

    it('returns undefined for missing node', async () => {
      expect(await kg.getNode('nonexistent')).toBeUndefined();
    });

    it('adds multiple nodes in batch', async () => {
      const nodes = [
        { id: 'batch:1', type: NodeType.Ingredient, label: 'Vitamin C', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'batch:2', type: NodeType.Ingredient, label: 'Vitamin E', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'batch:3', type: NodeType.SkinType, label: 'Dry', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      await kg.addNodes(nodes);
      expect(await kg.getNode('batch:1')).toBeDefined();
      expect(await kg.getNode('batch:2')).toBeDefined();
      expect(await kg.getNode('batch:3')).toBeDefined();
      const count = await kg.count();
      expect(count.nodes).toBe(3);
    });

    it('deletes a node', async () => {
      const node = { id: 'del:1', type: NodeType.Benefit, label: 'Hydration', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      await kg.addNode(node);
      expect(await kg.getNode('del:1')).toBeDefined();
      await kg.deleteNode('del:1');
      expect(await kg.getNode('del:1')).toBeUndefined();
    });

    it('finds node by label', async () => {
      const node = { id: 'find:1', type: NodeType.Ingredient, label: 'Niacinamide', properties: { category: 'Vitamin' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      await kg.addNode(node);
      const found = await kg.getNodeByLabel('Niacinamide');
      expect(found).toBeDefined();
      expect(found!.id).toBe('find:1');
    });
  });

  describe('Edge operations', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'a', type: NodeType.Ingredient, label: 'Retinol', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'b', type: NodeType.Ingredient, label: 'Vitamin C', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'c', type: NodeType.SkinConcern, label: 'Aging', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    it('adds and retrieves an edge', async () => {
      const edge = { id: 'e1', source: 'a', target: 'c', type: EdgeType.TREATS, weight: 1.0, properties: {}, createdAt: '2024-01-01' };
      await kg.addEdge(edge);
      const result = await kg.getEdge('a', 'c', EdgeType.TREATS);
      expect(result).toBeDefined();
      expect(result!.type).toBe(EdgeType.TREATS);
    });

    it('does not duplicate edges', async () => {
      const edge = { id: 'e1', source: 'a', target: 'c', type: EdgeType.TREATS, weight: 1.0, properties: {}, createdAt: '2024-01-01' };
      await kg.addEdge(edge);
      const dup = { id: 'e2', source: 'a', target: 'c', type: EdgeType.TREATS, weight: 0.5, properties: {}, createdAt: '2024-01-01' };
      await kg.addEdge(dup);
      const result = await kg.getEdge('a', 'c', EdgeType.TREATS);
      expect(result!.weight).toBe(1.0);
    });

    it('returns edges from a node', async () => {
      await kg.addEdge({ id: 'e1', source: 'a', target: 'c', type: EdgeType.TREATS, weight: 1.0, properties: {}, createdAt: '2024-01-01' });
      await kg.addEdge({ id: 'e2', source: 'a', target: 'b', type: EdgeType.INCOMPATIBLE_WITH, weight: 0, properties: {}, createdAt: '2024-01-01' });
      const fromA = await kg.getEdgesFrom('a');
      expect(fromA).toHaveLength(2);
    });

    it('returns edges to a node', async () => {
      await kg.addEdge({ id: 'e1', source: 'b', target: 'a', type: EdgeType.COMPATIBLE_WITH, weight: 0.8, properties: {}, createdAt: '2024-01-01' });
      const toA = await kg.getEdgesTo('a');
      expect(toA).toHaveLength(1);
      expect(toA[0].source).toBe('b');
    });
  });

  describe('Query operations', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'ing:1', type: NodeType.Ingredient, label: 'Retinol', properties: { category: 'Retinoid', safety: 'caution' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'ing:2', type: NodeType.Ingredient, label: 'Vitamin C', properties: { category: 'Vitamin', safety: 'safe' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'ing:3', type: NodeType.Ingredient, label: 'Hyaluronic Acid', properties: { category: 'Humectant', safety: 'safe' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'st:1', type: NodeType.SkinType, label: 'Dry', properties: { description: 'Lacks oil' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'st:2', type: NodeType.SkinType, label: 'Oily', properties: { description: 'Excess sebum' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    it('queries by node type', async () => {
      const ingredients = await kg.query({ nodeType: NodeType.Ingredient });
      expect(ingredients).toHaveLength(3);
    });

    it('queries by label', async () => {
      const results = await kg.query({ labels: ['retinol'] });
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('Retinol');
    });

    it('queries by properties', async () => {
      const safe = await kg.query({ nodeType: NodeType.Ingredient, properties: { safety: 'safe' } });
      expect(safe).toHaveLength(2);
    });

    it('returns empty for no matches', async () => {
      const results = await kg.query({ nodeType: NodeType.Brand });
      expect(results).toHaveLength(0);
    });

    it('respects limit and offset', async () => {
      const limited = await kg.query({ nodeType: NodeType.Ingredient, limit: 2 });
      expect(limited).toHaveLength(2);
      const offset = await kg.query({ nodeType: NodeType.Ingredient, limit: 2, offset: 2 });
      expect(offset).toHaveLength(1);
    });
  });

  describe('Semantic query', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'i:1', type: NodeType.Ingredient, label: 'Hyaluronic Acid', properties: { description: 'Provides deep hydration and moisture retention for dry skin' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'i:2', type: NodeType.Ingredient, label: 'Retinol', properties: { description: 'Anti-aging ingredient that boosts collagen' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'i:3', type: NodeType.Ingredient, label: 'Salicylic Acid', properties: { description: 'Treats acne and exfoliates pores' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'c:1', type: NodeType.SkinConcern, label: 'Acne', properties: { description: 'Pimples and breakouts' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    it('finds by semantic relevance', async () => {
      const results = await kg.semanticQuery({ text: 'Acne', topK: 5 });
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].label).toBe('Acne');
    });

    it('filters by node type', async () => {
      const results = await kg.semanticQuery({ text: 'hydration', nodeTypes: [NodeType.Ingredient], topK: 5 });
      expect(results.every((r) => r.type === NodeType.Ingredient)).toBe(true);
    });

    it('respects minScore', async () => {
      const results = await kg.semanticQuery({ text: 'xyz_nonexistent', minScore: 0.5 });
      expect(results).toHaveLength(0);
    });
  });

  describe('Path finding', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'a', type: NodeType.Ingredient, label: 'A', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'b', type: NodeType.Ingredient, label: 'B', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'c', type: NodeType.Ingredient, label: 'C', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'd', type: NodeType.SkinConcern, label: 'D', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await kg.addEdges([
        { id: 'e1', source: 'a', target: 'b', type: EdgeType.COMPATIBLE_WITH, weight: 0.8, properties: {}, createdAt: '2024-01-01' },
        { id: 'e2', source: 'b', target: 'c', type: EdgeType.COMPATIBLE_WITH, weight: 0.8, properties: {}, createdAt: '2024-01-01' },
        { id: 'e3', source: 'c', target: 'd', type: EdgeType.TREATS, weight: 0.9, properties: {}, createdAt: '2024-01-01' },
      ]);
    });

    it('finds path between connected nodes', async () => {
      const path = await kg.findPath('a', 'd');
      expect(path).not.toBeNull();
      expect(path!.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(path!.edges).toHaveLength(3);
    });

    it('finds direct neighbor path', async () => {
      const path = await kg.findPath('a', 'b');
      expect(path).not.toBeNull();
      expect(path!.nodes).toHaveLength(2);
    });

    it('returns null for disconnected nodes', async () => {
      await kg.addNode({ id: 'isolated', type: NodeType.Benefit, label: 'Isolated', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      const path = await kg.findPath('a', 'isolated');
      expect(path).toBeNull();
    });

    it('finds multiple paths', async () => {
      const paths = await kg.findPaths('a', 'd', 3);
      expect(paths.length).toBeGreaterThanOrEqual(1);
      expect(paths[0].nodes[0].id).toBe('a');
      expect(paths[0].nodes[paths[0].nodes.length - 1].id).toBe('d');
    });
  });

  describe('Traversal', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'x', type: NodeType.Product, label: 'Product X', properties: { price: 50 }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'ing1', type: NodeType.Ingredient, label: 'Retinol', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'ing2', type: NodeType.Ingredient, label: 'Vitamin C', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'sc1', type: NodeType.SkinConcern, label: 'Aging', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await kg.addEdges([
        { id: 'ex1', source: 'x', target: 'ing1', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
        { id: 'ex2', source: 'x', target: 'ing2', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
        { id: 'ex3', source: 'ing1', target: 'sc1', type: EdgeType.TREATS, weight: 0.9, properties: {}, createdAt: '2024-01-01' },
      ]);
    });

    it('traverses outbound edges', async () => {
      const results = await kg.traverse('x', { edgeTypes: [EdgeType.CONTAINS], maxDepth: 1, direction: 'outbound' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.node.id).sort()).toEqual(['ing1', 'ing2']);
    });
  });

  describe('Neighbors', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'p1', type: NodeType.Product, label: 'P1', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'i1', type: NodeType.Ingredient, label: 'Retinol', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'i2', type: NodeType.Ingredient, label: 'Ceramides', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await kg.addEdges([
        { id: 'ep1', source: 'p1', target: 'i1', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
        { id: 'ep2', source: 'p1', target: 'i2', type: EdgeType.CONTAINS, weight: 1.0, properties: {}, createdAt: '2024-01-01' },
      ]);
    });

    it('gets all neighbors', async () => {
      const neighbors = await kg.getNeighbors('p1');
      expect(neighbors).toHaveLength(2);
    });

    it('filters neighbors by edge type', async () => {
      const neighbors = await kg.getNeighbors('p1', EdgeType.CONTAINS);
      expect(neighbors).toHaveLength(2);
      const nonExistent = await kg.getNeighbors('p1', EdgeType.TREATS);
      expect(nonExistent).toHaveLength(0);
    });
  });

  describe('Find similar', () => {
    beforeEach(async () => {
      await kg.addNodes([
        { id: 'p1', type: NodeType.Product, label: 'Hydrating Serum', properties: { price: 42, productType: 'Serum', tags: ['hydration', 'vitamin c'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'p2', type: NodeType.Product, label: 'Brightening Serum', properties: { price: 48, productType: 'Serum', tags: ['brightening', 'vitamin c'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'p3', type: NodeType.Product, label: 'Night Cream', properties: { price: 58, productType: 'Moisturizer', tags: ['night', 'rich'] }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    it('finds similar products by type and tags', async () => {
      const similar = await kg.findSimilar('p1', 5);
      expect(similar.some((n) => n.id === 'p2')).toBe(true);
    });
  });

  describe('Count and stats', () => {
    it('reports zero counts for empty graph', async () => {
      const count = await kg.count();
      expect(count.nodes).toBe(0);
      expect(count.edges).toBe(0);
    });

    it('reports correct counts', async () => {
      await kg.addNodes([
        { id: 's:1', type: NodeType.SkinType, label: 'Dry', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'c:1', type: NodeType.SkinConcern, label: 'Aging', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await kg.addEdge({ id: 'e1', source: 's:1', target: 'c:1', type: EdgeType.SUITABLE_FOR, weight: 1, properties: {}, createdAt: '2024-01-01' });
      const count = await kg.count();
      expect(count.nodes).toBe(2);
      expect(count.edges).toBe(1);
    });

    it('returns detailed stats', async () => {
      await kg.addNodes([
        { id: 'a', type: NodeType.Ingredient, label: 'A', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'b', type: NodeType.SkinType, label: 'B', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await kg.addEdge({ id: 'e1', source: 'a', target: 'b', type: EdgeType.SUITABLE_FOR, weight: 1, properties: {}, createdAt: '2024-01-01' });
      const stats = await kg.stats();
      expect(stats.totalNodes).toBe(2);
      expect(stats.totalEdges).toBe(1);
      expect(stats.byType[NodeType.Ingredient]).toBe(1);
      expect(stats.byType[NodeType.SkinType]).toBe(1);
    });
  });

  describe('Bulk import', () => {
    it('imports nodes and edges in batch', async () => {
      const nodes = [
        { id: 'bulk:1', type: NodeType.Ingredient, label: 'A', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'bulk:2', type: NodeType.Ingredient, label: 'B', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      const edges = [{ id: 'be1', source: 'bulk:1', target: 'bulk:2', type: EdgeType.COMPATIBLE_WITH, weight: 0.8, properties: {}, createdAt: '2024-01-01' }];
      const result = await kg.bulkImport(nodes, edges);
      expect(result.nodes).toBe(2);
      expect(result.edges).toBe(1);
    });
  });

  describe('Clear', () => {
    it('clears all data', async () => {
      await kg.addNode({ id: 'c:1', type: NodeType.Benefit, label: 'Hydration', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      await kg.clear();
      const count = await kg.count();
      expect(count.nodes).toBe(0);
      expect(count.edges).toBe(0);
    });
  });

  describe('FindByLabelAndType', () => {
    it('finds exact label and type match', async () => {
      await kg.addNode({ id: 'ft:1', type: NodeType.Ingredient, label: 'Niacinamide', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      const found = await kg.findByLabelAndType('Niacinamide', NodeType.Ingredient);
      expect(found).toBeDefined();
      expect(found!.id).toBe('ft:1');
    });

    it('returns undefined when type mismatches', async () => {
      await kg.addNode({ id: 'ft:2', type: NodeType.Ingredient, label: 'Retinol', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      const found = await kg.findByLabelAndType('Retinol', NodeType.SkinType);
      expect(found).toBeUndefined();
    });
  });

  describe('GetByType', () => {
    it('returns all nodes of a type', async () => {
      await kg.addNodes([
        { id: 'gt:1', type: NodeType.Benefit, label: 'Hydration', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'gt:2', type: NodeType.Benefit, label: 'Brightening', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'gt:3', type: NodeType.Benefit, label: 'Anti-Aging', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      const benefits = await kg.getByType(NodeType.Benefit);
      expect(benefits).toHaveLength(3);
    });
  });

  describe('Events / subscriptions', () => {
    it('triggers node:added event', (done) => {
      kg.on('node:added', (data) => {
        expect(data.id).toBe('evt:1');
        done();
      });
      kg.addNode({ id: 'evt:1', type: NodeType.Benefit, label: 'Test', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    });
  });
});
