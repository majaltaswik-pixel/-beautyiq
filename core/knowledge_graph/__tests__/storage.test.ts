import { InMemoryGraphStorage } from '../adapters/storage';
import { NodeType, EdgeType, GraphNode, GraphEdge } from '../schema';

describe('InMemoryGraphStorage', () => {
  let storage: InMemoryGraphStorage;

  beforeEach(() => {
    storage = new InMemoryGraphStorage();
  });

  describe('node operations', () => {
    const makeNode = (id: string, type = NodeType.Ingredient, label = 'Test'): GraphNode => ({
      id, type, label, properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01',
    });

    it('adds single node', async () => {
      await storage.addNode(makeNode('n1'));
      const node = await storage.getNode('n1');
      expect(node).toBeDefined();
      expect(node!.id).toBe('n1');
    });

    it('adds multiple nodes', async () => {
      await storage.addNodes([makeNode('a'), makeNode('b'), makeNode('c')]);
      expect((await storage.getNode('a'))!.id).toBe('a');
      expect((await storage.getNode('b'))!.id).toBe('b');
      expect((await storage.getNode('c'))!.id).toBe('c');
      const count = await storage.count();
      expect(count.nodes).toBe(3);
    });

    it('deletes a node', async () => {
      await storage.addNode(makeNode('del'));
      await storage.deleteNode('del');
      expect(await storage.getNode('del')).toBeUndefined();
    });

    it('finds nodes by type', async () => {
      await storage.addNodes([
        makeNode('i1', NodeType.Ingredient, 'Retinol'),
        makeNode('i2', NodeType.Ingredient, 'Vitamin C'),
        makeNode('s1', NodeType.SkinType, 'Dry'),
      ]);
      const ingredients = await storage.getNodesByType(NodeType.Ingredient);
      expect(ingredients).toHaveLength(2);
    });

    it('finds nodes by label', async () => {
      await storage.addNode(makeNode('l1', NodeType.Ingredient, 'Niacinamide'));
      const found = await storage.findNodesByLabel('Niacinamide');
      expect(found).toHaveLength(1);
    });
  });

  describe('edge operations', () => {
    beforeEach(async () => {
      await storage.addNodes([
        { id: 'a', type: NodeType.Ingredient, label: 'A', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'b', type: NodeType.Ingredient, label: 'B', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'c', type: NodeType.Ingredient, label: 'C', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    const makeEdge = (id: string, s: string, t: string, type: EdgeType = EdgeType.COMPATIBLE_WITH): GraphEdge => ({
      id, source: s, target: t, type, weight: 1.0, properties: {}, createdAt: '2024-01-01',
    });

    it('adds and retrieves edges', async () => {
      await storage.addEdge(makeEdge('e1', 'a', 'b'));
      const edge = await storage.getEdge('a', 'b', EdgeType.COMPATIBLE_WITH);
      expect(edge).toBeDefined();
    });

    it('gets outbound edges', async () => {
      await storage.addEdges([makeEdge('e1', 'a', 'b'), makeEdge('e2', 'a', 'c')]);
      const fromA = await storage.getEdgesFrom('a');
      expect(fromA).toHaveLength(2);
    });

    it('gets inbound edges', async () => {
      await storage.addEdges([makeEdge('e1', 'b', 'a'), makeEdge('e2', 'c', 'a')]);
      const toA = await storage.getEdgesTo('a');
      expect(toA).toHaveLength(2);
    });

    it('gets all edges', async () => {
      await storage.addEdges([makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')]);
      const all = await storage.getAllEdges();
      expect(all).toHaveLength(2);
    });
  });

  describe('query nodes', () => {
    beforeEach(async () => {
      await storage.addNodes([
        { id: 'p1', type: NodeType.Product, label: 'Product A', properties: { price: 50, type: 'serum' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'p2', type: NodeType.Product, label: 'Product B', properties: { price: 30, type: 'lotion' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'p3', type: NodeType.Product, label: 'Product C', properties: { price: 40, type: 'serum' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    });

    it('filters by property', async () => {
      const results = await storage.queryNodes({ nodeType: NodeType.Product, properties: { type: 'serum' } });
      expect(results).toHaveLength(2);
    });

    it('filters by node IDs', async () => {
      const results = await storage.queryNodes({ nodeIds: ['p1', 'p3'] });
      expect(results).toHaveLength(2);
    });

    it('sorts by property descending', async () => {
      const results = await storage.queryNodes({ nodeType: NodeType.Product, sortBy: 'price', sortDirection: 'desc' });
      expect(results[0].id).toBe('p1');
      expect(results[2].id).toBe('p2');
    });

    it('paginates with limit and offset', async () => {
      const page1 = await storage.queryNodes({ nodeType: NodeType.Product, limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);
      const page2 = await storage.queryNodes({ nodeType: NodeType.Product, limit: 2, offset: 2 });
      expect(page2).toHaveLength(1);
    });
  });

  describe('clear and count', () => {
    it('counts correctly', async () => {
      await storage.addNodes([
        { id: 'a', type: NodeType.Benefit, label: 'A', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'b', type: NodeType.Benefit, label: 'B', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      await storage.addEdge({ id: 'e1', source: 'a', target: 'b', type: EdgeType.COMPATIBLE_WITH, weight: 1, properties: {}, createdAt: '2024-01-01' });
      const count = await storage.count();
      expect(count.nodes).toBe(2);
      expect(count.edges).toBe(1);
    });

    it('clears all data', async () => {
      await storage.addNode({ id: 'tmp', type: NodeType.Benefit, label: 'Temp', properties: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' });
      await storage.clear();
      const count = await storage.count();
      expect(count.nodes).toBe(0);
      expect(count.edges).toBe(0);
    });
  });
});
