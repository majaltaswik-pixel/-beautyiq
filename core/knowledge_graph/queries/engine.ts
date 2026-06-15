import { GraphNode, GraphEdge, NodeType, EdgeType, KnowledgeGraphQuery, SemanticQuery, GraphPath, TraversalRule } from '../schema';
import { GraphStorageAdapter } from '../adapters/storage';

interface ScoredResult {
  node: GraphNode;
  score: number;
  path?: GraphEdge[];
}

export class QueryEngine {
  constructor(private storage: GraphStorageAdapter) {}

  async search(query: KnowledgeGraphQuery): Promise<GraphNode[]> {
    return this.storage.queryNodes(query);
  }

  async semanticSearch(query: SemanticQuery): Promise<GraphNode[]> {
    const results = query.nodeTypes?.length
      ? (await Promise.all(query.nodeTypes.map((t) => this.storage.getNodesByType(t)))).flat()
      : (await this.storage.queryNodes({ limit: 1000 }));
    const lower = query.text.toLowerCase();
    const scored = results
      .map((node) => ({ node, score: this.relevanceScore(node, lower) }))
      .filter((s) => (query.minScore ? s.score >= query.minScore : s.score > 0))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, query.topK || 10).map((s) => ({ ...s.node, score: s.score }));
  }

  async findPath(startId: string, endId: string, maxDepth = 5): Promise<GraphPath | null> {
    if (startId === endId) {
      const node = await this.storage.getNode(startId);
      return node ? { nodes: [node], edges: [], score: 1 } : null;
    }
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: GraphNode[]; edges: GraphEdge[] }> = [
      { nodeId: startId, path: [await this.storage.getNode(startId)].filter(Boolean) as GraphNode[], edges: [] },
    ];
    while (queue.length > 0) {
      const { nodeId, path, edges } = queue.shift()!;
      if (nodeId === endId) return { nodes: path, edges, score: 1 / (path.length || 1) };
      if (path.length >= maxDepth) continue;
      const outEdges = await this.storage.getEdgesFrom(nodeId);
      for (const edge of outEdges) {
        if (visited.has(edge.target)) continue;
        visited.add(edge.target);
        const neighbor = await this.storage.getNode(edge.target);
        if (!neighbor) continue;
        queue.push({ nodeId: edge.target, path: [...path, neighbor], edges: [...edges, edge] });
      }
      const inEdges = await this.storage.getEdgesTo(nodeId);
      for (const edge of inEdges) {
        if (visited.has(edge.source)) continue;
        visited.add(edge.source);
        const neighbor = await this.storage.getNode(edge.source);
        if (!neighbor) continue;
        queue.push({ nodeId: edge.source, path: [...path, neighbor], edges: [...edges, edge] });
      }
    }
    return null;
  }

  async findPaths(startId: string, endId: string, maxResults = 5, maxDepth = 5): Promise<GraphPath[]> {
    const results: GraphPath[] = [];
    const queue: Array<{ nodeId: string; path: GraphNode[]; edges: GraphEdge[]; visited: Set<string> }> = [
      { nodeId: startId, path: [], edges: [], visited: new Set([startId]) },
    ];
    while (queue.length > 0 && results.length < maxResults) {
      const { nodeId, path, edges, visited } = queue.shift()!;
      const currentNode = await this.storage.getNode(nodeId);
      const currentPath = [...path, currentNode!];
      if (nodeId === endId) { results.push({ nodes: currentPath, edges, score: 1 / currentPath.length }); continue; }
      if (currentPath.length >= maxDepth) continue;
      const allEdges = [...await this.storage.getEdgesFrom(nodeId), ...await this.storage.getEdgesTo(nodeId)];
      for (const edge of allEdges) {
        const nextId = edge.source === nodeId ? edge.target : edge.source;
        if (visited.has(nextId)) continue;
        const nextVisited = new Set(visited);
        nextVisited.add(nextId);
        queue.push({ nodeId: nextId, path: currentPath, edges: [...edges, edge], visited: nextVisited });
      }
    }
    return results;
  }

  async traverse(startId: string, rule: TraversalRule): Promise<ScoredResult[]> {
    const visited = new Map<string, number>();
    const results: ScoredResult[] = [];
    const startNode = await this.storage.getNode(startId);
    if (!startNode) return [];
    visited.set(startId, 0);
    const queue: Array<{ nodeId: string; depth: number; edgePath: GraphEdge[] }> = [{ nodeId: startId, depth: 0, edgePath: [] }];
    while (queue.length > 0) {
      const { nodeId, depth, edgePath } = queue.shift()!;
      if (depth >= rule.maxDepth) continue;
      const allEdges = rule.direction === 'outbound' || rule.direction === 'both'
        ? await this.storage.getEdgesFrom(nodeId) : [];
      const inEdges = rule.direction === 'inbound' || rule.direction === 'both'
        ? await this.storage.getEdgesTo(nodeId) : [];
      for (const edge of [...allEdges, ...inEdges]) {
        if (!rule.edgeTypes.includes(edge.type)) continue;
        if (rule.minEdgeWeight && edge.weight < rule.minEdgeWeight) continue;
        const nextId = edge.source === nodeId ? edge.target : edge.source;
        if (visited.has(nextId) && visited.get(nextId)! <= depth + 1) continue;
        visited.set(nextId, depth + 1);
        const nextNode = await this.storage.getNode(nextId);
        if (!nextNode) continue;
        const newPath = [...edgePath, edge];
        const totalWeight = newPath.reduce((s, e) => s + e.weight / newPath.length, 0);
        results.push({ node: nextNode, score: totalWeight, path: newPath });
        queue.push({ nodeId: nextId, depth: depth + 1, edgePath: newPath });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  async getNeighbors(nodeId: string, edgeType?: EdgeType): Promise<Array<{ node: GraphNode; edge: GraphEdge }>> {
    const results: Array<{ node: GraphNode; edge: GraphEdge }> = [];
    for (const edge of [...await this.storage.getEdgesFrom(nodeId), ...await this.storage.getEdgesTo(nodeId)]) {
      if (edgeType && edge.type !== edgeType) continue;
      const neighborId = edge.source === nodeId ? edge.target : edge.source;
      const neighbor = await this.storage.getNode(neighborId);
      if (neighbor) results.push({ node: neighbor, edge });
    }
    return results;
  }

  async findSimilar(nodeId: string, topK = 10): Promise<GraphNode[]> {
    const node = await this.storage.getNode(nodeId);
    if (!node) return [];
    const sameType = await this.storage.getNodesByType(node.type);
    const neighbors = await this.getNeighbors(nodeId);
    const neighborIds = new Set(neighbors.map((n) => n.node.id));
    const scored: ScoredResult[] = sameType
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        let score = 0;
        const nodeProps = node.properties;
        const nProps = n.properties;
        for (const key of ['price', 'category', 'productType', 'vendor', 'brand']) {
          if (nodeProps[key] && nProps[key] === nodeProps[key]) score += 0.3;
        }
        const nodeTags: string[] = nodeProps.tags || [];
        const nTags: string[] = nProps.tags || [];
        const common = nodeTags.filter((t) => nTags.includes(t));
        score += common.length * 0.15;
        if (neighborIds.has(n.id)) score += 0.2;
        return { node: n, score: Math.min(score, 1) };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => ({ ...s.node, score: s.score }));
  }

  private relevanceScore(node: GraphNode, searchText: string): number {
    let score = 0;
    const label = node.label.toLowerCase();
    if (label === searchText) return 1.0;
    if (label.includes(searchText)) score += 0.8;
    if (searchText.includes(label)) score += 0.6;
    const desc = (node.properties.description || '').toLowerCase();
    if (desc.includes(searchText)) score += 0.4;
    const tags = node.properties.tags || [];
    if (Array.isArray(tags) && tags.some((t: string) => t.toLowerCase().includes(searchText))) score += 0.3;
    const nodeType = node.type.toLowerCase();
    if (nodeType.includes(searchText)) score += 0.2;
    const synonyms: Record<string, string[]> = {
      'dry': ['dehydrated', 'flaky', 'tight'],
      'oily': ['greasy', 'shiny', 'sebum'],
      'acne': ['pimple', 'breakout', 'zit', 'blemish'],
      'aging': ['wrinkle', 'fine line', 'mature'],
    };
    for (const [key, syns] of Object.entries(synonyms)) {
      if (searchText.includes(key) || key.includes(searchText)) {
        if (syns.some((s) => label.includes(s))) score += 0.3;
      }
    }
    return score;
  }
}
