import { GraphNode, GraphEdge, KnowledgeGraphQuery, EdgeType } from '../schema';

export interface GraphStorageAdapter {
  addNode(node: GraphNode): Promise<void>;
  addNodes(nodes: GraphNode[]): Promise<void>;
  addEdge(edge: GraphEdge): Promise<void>;
  addEdges(edges: GraphEdge[]): Promise<void>;
  getNode(id: string): Promise<GraphNode | undefined>;
  getEdge(source: string, target: string, type: EdgeType): Promise<GraphEdge | undefined>;
  queryNodes(query: KnowledgeGraphQuery): Promise<GraphNode[]>;
  getAllEdges(): Promise<GraphEdge[]>;
  getEdgesFrom(nodeId: string): Promise<GraphEdge[]>;
  getEdgesTo(nodeId: string): Promise<GraphEdge[]>;
  getNodesByType(type: string): Promise<GraphNode[]>;
  findNodesByLabel(label: string): Promise<GraphNode[]>;
  deleteNode(id: string): Promise<void>;
  deleteEdge(id: string): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<{ nodes: number; edges: number }>;
}

export class InMemoryGraphStorage implements GraphStorageAdapter {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();
  private outEdges: Map<string, Set<string>> = new Map();
  private inEdges: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private labelIndex: Map<string, Set<string>> = new Map();

  async addNode(node: GraphNode): Promise<void> {
    this.nodes.set(node.id, node);
    this.indexNode(node);
  }

  async addNodes(nodes: GraphNode[]): Promise<void> {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.indexNode(node);
    }
  }

  async addEdge(edge: GraphEdge): Promise<void> {
    const key = `${edge.source}:${edge.type}:${edge.target}`;
    this.edges.set(key, edge);
    if (!this.adjacency.has(edge.source)) this.adjacency.set(edge.source, new Set());
    if (!this.adjacency.has(edge.target)) this.adjacency.set(edge.target, new Set());
    this.adjacency.get(edge.source)!.add(edge.target);
    this.adjacency.get(edge.target)!.add(edge.source);
    if (!this.outEdges.has(edge.source)) this.outEdges.set(edge.source, new Set());
    if (!this.inEdges.has(edge.target)) this.inEdges.set(edge.target, new Set());
    this.outEdges.get(edge.source)!.add(key);
    this.inEdges.get(edge.target)!.add(key);
  }

  async addEdges(edges: GraphEdge[]): Promise<void> {
    for (const edge of edges) await this.addEdge(edge);
  }

  async getNode(id: string): Promise<GraphNode | undefined> {
    return this.nodes.get(id);
  }

  async getEdge(source: string, target: string, type: EdgeType): Promise<GraphEdge | undefined> {
    return this.edges.get(`${source}:${type}:${target}`);
  }

  async queryNodes(query: KnowledgeGraphQuery): Promise<GraphNode[]> {
    let results = [...this.nodes.values()];
    if (query.nodeType) results = results.filter((n) => n.type === query.nodeType);
    if (query.labels?.length) results = results.filter((n) => query.labels!.some((l) => n.label.toLowerCase().includes(l.toLowerCase())));
    if (query.properties && Object.keys(query.properties).length) {
      results = results.filter((n) => Object.entries(query.properties!).every(([k, v]) => n.properties[k] === v));
    }
    if (query.nodeIds?.length) results = results.filter((n) => query.nodeIds!.includes(n.id));
    if (query.sortBy) {
      results.sort((a, b) => {
        const av = a.properties[query.sortBy!] ?? 0;
        const bv = b.properties[query.sortBy!] ?? 0;
        return query.sortDirection === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
    }
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return results.slice(offset, offset + limit);
  }

  async getAllEdges(): Promise<GraphEdge[]> {
    return [...this.edges.values()];
  }

  async getEdgesFrom(nodeId: string): Promise<GraphEdge[]> {
    const keys = this.outEdges.get(nodeId);
    if (!keys) return [];
    return [...keys].map((k) => this.edges.get(k)!).filter(Boolean);
  }

  async getEdgesTo(nodeId: string): Promise<GraphEdge[]> {
    const keys = this.inEdges.get(nodeId);
    if (!keys) return [];
    return [...keys].map((k) => this.edges.get(k)!).filter(Boolean);
  }

  async getNodesByType(type: string): Promise<GraphNode[]> {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return [...ids].map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  async findNodesByLabel(label: string): Promise<GraphNode[]> {
    const lower = label.toLowerCase();
    const ids = this.labelIndex.get(lower);
    if (!ids) return [];
    return [...ids].map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id);
    this.typeIndex.forEach((set) => set.delete(id));
    this.labelIndex.forEach((set) => set.delete(id));
    this.adjacency.delete(id);
    this.outEdges.delete(id);
    this.inEdges.delete(id);
    const toRemove = [...this.edges.keys()].filter((k) => k.startsWith(`${id}:`) || k.endsWith(`:${id}`));
    for (const k of toRemove) this.edges.delete(k);
  }

  async deleteEdge(id: string): Promise<void> {
    this.edges.delete(id);
  }

  async clear(): Promise<void> {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
    this.outEdges.clear();
    this.inEdges.clear();
    this.typeIndex.clear();
    this.labelIndex.clear();
  }

  async count(): Promise<{ nodes: number; edges: number }> {
    return { nodes: this.nodes.size, edges: this.edges.size };
  }

  private indexNode(node: GraphNode): void {
    if (!this.typeIndex.has(node.type)) this.typeIndex.set(node.type, new Set());
    this.typeIndex.get(node.type)!.add(node.id);
    const labelKey = node.label.toLowerCase();
    if (!this.labelIndex.has(labelKey)) this.labelIndex.set(labelKey, new Set());
    this.labelIndex.get(labelKey)!.add(node.id);
    if (!this.adjacency.has(node.id)) this.adjacency.set(node.id, new Set());
    if (!this.outEdges.has(node.id)) this.outEdges.set(node.id, new Set());
    if (!this.inEdges.has(node.id)) this.inEdges.set(node.id, new Set());
  }
}
