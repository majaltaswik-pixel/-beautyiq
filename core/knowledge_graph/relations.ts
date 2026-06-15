import { GraphNode, GraphEdge, NodeType, EdgeType, KnowledgeGraphQuery, SemanticQuery, GraphPath, TraversalRule } from './schema';
import { GraphStorageAdapter, InMemoryGraphStorage } from './adapters/storage';
import { QueryEngine } from './queries/engine';

export class KnowledgeGraph {
  private storage: GraphStorageAdapter;
  private engine: QueryEngine;
  private subscribers: Array<(event: string, data: any) => void> = [];

  constructor(adapter?: GraphStorageAdapter) {
    this.storage = adapter || new InMemoryGraphStorage();
    this.engine = new QueryEngine(this.storage);
  }

  on(event: string, callback: (data: any) => void): void {
    this.subscribers.push((e, d) => { if (e === event) callback(d); });
  }

  private emit(event: string, data: any): void {
    for (const sub of this.subscribers) sub(event, data);
  }

  // ── Node operations ──

  async addNode(node: GraphNode): Promise<void> {
    await this.storage.addNode(node);
    this.emit('node:added', { id: node.id, type: node.type, label: node.label });
  }

  async addNodes(nodes: GraphNode[]): Promise<void> {
    await this.storage.addNodes(nodes);
    this.emit('nodes:added', { count: nodes.length });
  }

  async getNode(id: string): Promise<GraphNode | undefined> {
    return this.storage.getNode(id);
  }

  async getNodeByLabel(label: string): Promise<GraphNode | undefined> {
    const results = await this.storage.findNodesByLabel(label);
    return results[0];
  }

  async deleteNode(id: string): Promise<void> {
    await this.storage.deleteNode(id);
    this.emit('node:deleted', { id });
  }

  // ── Edge operations ──

  async addEdge(edge: GraphEdge): Promise<void> {
    const existing = await this.storage.getEdge(edge.source, edge.target, edge.type);
    if (existing) return;
    await this.storage.addEdge(edge);
    this.emit('edge:added', { source: edge.source, target: edge.target, type: edge.type });
  }

  async addEdges(edges: GraphEdge[]): Promise<void> {
    await this.storage.addEdges(edges);
  }

  async getEdge(source: string, target: string, type: EdgeType): Promise<GraphEdge | undefined> {
    return this.storage.getEdge(source, target, type);
  }

  async getEdgesFrom(nodeId: string): Promise<GraphEdge[]> {
    return this.storage.getEdgesFrom(nodeId);
  }

  async getEdgesTo(nodeId: string): Promise<GraphEdge[]> {
    return this.storage.getEdgesTo(nodeId);
  }

  // ── Query operations ──

  async query(query: KnowledgeGraphQuery): Promise<GraphNode[]> {
    return this.engine.search(query);
  }

  async semanticQuery(query: SemanticQuery): Promise<GraphNode[]> {
    return this.engine.semanticSearch(query);
  }

  async findPath(startId: string, endId: string, maxDepth = 5): Promise<GraphPath | null> {
    return this.engine.findPath(startId, endId, maxDepth);
  }

  async findPaths(startId: string, endId: string, maxResults = 5, maxDepth = 5): Promise<GraphPath[]> {
    return this.engine.findPaths(startId, endId, maxResults, maxDepth);
  }

  async traverse(startId: string, rule: TraversalRule): Promise<Array<{ node: GraphNode; score: number; path?: GraphEdge[] }>> {
    return this.engine.traverse(startId, rule);
  }

  async getNeighbors(nodeId: string, edgeType?: EdgeType): Promise<Array<{ node: GraphNode; edge: GraphEdge }>> {
    return this.engine.getNeighbors(nodeId, edgeType);
  }

  async findSimilar(nodeId: string, topK = 10): Promise<GraphNode[]> {
    return this.engine.findSimilar(nodeId, topK);
  }

  async findByLabelAndType(label: string, type: NodeType): Promise<GraphNode | undefined> {
    const results = await this.storage.findNodesByLabel(label);
    return results.find((n) => n.type === type);
  }

  async getByType(type: NodeType): Promise<GraphNode[]> {
    return this.storage.getNodesByType(type);
  }

  async getNodesByProperty(type: NodeType, key: string, value: any): Promise<GraphNode[]> {
    return this.storage.queryNodes({ nodeType: type, properties: { [key]: value } });
  }

  // ── Bulk operations ──

  async bulkImport(nodes: GraphNode[], edges: GraphEdge[]): Promise<{ nodes: number; edges: number }> {
    await this.storage.addNodes(nodes);
    await this.storage.addEdges(edges);
    return { nodes: nodes.length, edges: edges.length };
  }

  async clear(): Promise<void> {
    await this.storage.clear();
    this.emit('graph:cleared', {});
  }

  async count(): Promise<{ nodes: number; edges: number }> {
    return this.storage.count();
  }

  async stats(): Promise<{
    totalNodes: number;
    totalEdges: number;
    byType: Record<string, number>;
    byEdgeType: Record<string, number>;
  }> {
    const c = await this.count();
    const byType: Record<string, number> = {};
    for (const t of Object.values(NodeType)) {
      const nodes = await this.storage.getNodesByType(t);
      if (nodes.length) byType[t] = nodes.length;
    }
    const byEdgeType: Record<string, number> = {};
    const allEdges = await this.storage.getAllEdges();
    for (const edge of allEdges) {
      byEdgeType[edge.type] = (byEdgeType[edge.type] || 0) + 1;
    }
    return { totalNodes: c.nodes, totalEdges: c.edges, byType, byEdgeType };
  }
}
