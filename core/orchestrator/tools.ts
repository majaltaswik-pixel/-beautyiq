import { RAGSystem } from '../rag/index';
import { KnowledgeGraph } from '../knowledge_graph/relations';
import { EdgeType, TraversalRule } from '../knowledge_graph/schema';
import { EventBus } from '../events/event_bus';
import { ProductRepository } from '../db/products';
import { NormalizedEvent } from '../events/types';

export interface OrchestratorTools {
  rag: RAGSystem;
  knowledgeGraph: KnowledgeGraph;
  eventBus: EventBus;
  productRepo: ProductRepository;
  queryKnowledgeGraph(query: string, topK?: number): Promise<any>;
  queryRAG(context: string, topK?: number): Promise<any>;
  getRAGContext(query: string): Promise<{ context: string; sources: any[] }>;
  getProductById(id: string): Promise<any>;
  getProductsByType(type: string): Promise<any[]>;
  searchProductsByIngredients(ingredients: string[]): Promise<any[]>;
  getEventsByCustomer(customerId: string, limit?: number): Promise<NormalizedEvent[]>;
  emitEvent(event: NormalizedEvent): Promise<void>;
  getEventHistory(type?: string): Promise<NormalizedEvent[]>;
  getSkinProfile(customerId: string): Promise<any>;
  getNeighbors(nodeId: string, edgeType?: string): Promise<any>;
  findGraphPath(startId: string, endId: string, maxDepth?: number): Promise<any>;
  findGraphPaths(startId: string, endId: string, maxResults?: number): Promise<any>;
  traverseGraph(startId: string, edgeTypes: EdgeType[], maxDepth: number, direction?: 'outbound' | 'inbound' | 'both'): Promise<any>;
  findSimilar(nodeId: string, topK?: number): Promise<any>;
  getGraphStats(): Promise<any>;
  getGraphNodesByType(type: string): Promise<any>;
  findIngredientSynergies(ingredientNames: string[]): Promise<any>;
}

export function createOrchestratorTools(
  rag: RAGSystem,
  knowledgeGraph: KnowledgeGraph,
  eventBus: EventBus,
  productRepo: ProductRepository,
): OrchestratorTools {
  return {
    rag,
    knowledgeGraph,
    eventBus,
    productRepo,

    async queryKnowledgeGraph(query: string, topK = 10) {
      return knowledgeGraph.semanticQuery({ text: query, topK });
    },

    async queryRAG(context: string, topK = 10) {
      return rag.query(context, topK);
    },

    async getRAGContext(query: string) {
      return rag.buildPrompt(query);
    },

    async getProductById(id: string) {
      try {
        return await productRepo.findById(id) || await productRepo.findByShopifyId(Number(id));
      } catch {
        return null;
      }
    },

    async getProductsByType(type: string) {
      try {
        return await productRepo.searchByType(type);
      } catch {
        return [];
      }
    },

    async searchProductsByIngredients(ingredients: string[]) {
      try {
        return await productRepo.searchByIngredients(ingredients);
      } catch {
        return [];
      }
    },

    async getEventsByCustomer(customerId: string, limit = 50) {
      const all = eventBus.getHistory();
      return all.filter((e) => e.customerId === customerId).slice(-limit);
    },

    async emitEvent(event: NormalizedEvent) {
      return eventBus.emit(event);
    },

    async getEventHistory(type?: string) {
      return type ? eventBus.getHistory(type as any) : eventBus.getHistory();
    },

    async getSkinProfile(customerId: string) {
      const events = await this.getEventsByCustomer(customerId);
      const profile: any = { customerId, skinType: null, skinConcerns: [], preferences: [] };
      for (const e of events) {
        if (e.data?.skinType) profile.skinType = e.data.skinType;
        if (e.data?.skinConcerns) profile.skinConcerns.push(...e.data.skinConcerns);
        if (e.data?.preferences) profile.preferences.push(...e.data.preferences);
      }
      return profile;
    },

    async getNeighbors(nodeId: string, edgeType?: string) {
      return knowledgeGraph.getNeighbors(nodeId, edgeType as EdgeType);
    },

    async findGraphPath(startId: string, endId: string, maxDepth = 5) {
      return knowledgeGraph.findPath(startId, endId, maxDepth);
    },

    async findGraphPaths(startId: string, endId: string, maxResults = 5) {
      return knowledgeGraph.findPaths(startId, endId, maxResults);
    },

    async traverseGraph(startId: string, edgeTypes: EdgeType[], maxDepth: number, direction: 'outbound' | 'inbound' | 'both' = 'both') {
      const rule: TraversalRule = { edgeTypes, maxDepth, direction };
      return knowledgeGraph.traverse(startId, rule);
    },

    async findSimilar(nodeId: string, topK = 10) {
      return knowledgeGraph.findSimilar(nodeId, topK);
    },

    async getGraphStats() {
      return knowledgeGraph.stats();
    },

    async getGraphNodesByType(type: string) {
      return knowledgeGraph.getByType(type as any);
    },

    async findIngredientSynergies(ingredientNames: string[]) {
      const results: Array<{ ingredient: string; synergies: string[]; conflicts: string[] }> = [];
      for (const name of ingredientNames) {
        const node = await knowledgeGraph.findByLabelAndType(name, 'Ingredient' as any);
        if (!node) continue;
        const neighbors = await knowledgeGraph.getNeighbors(node.id);
        const synergies = neighbors.filter((n) => n.edge.type === EdgeType.COMPATIBLE_WITH || n.edge.type === EdgeType.SYNERGIZES_WITH).map((n) => n.node.label);
        const conflicts = neighbors.filter((n) => n.edge.type === EdgeType.INCOMPATIBLE_WITH).map((n) => n.node.label);
        results.push({ ingredient: name, synergies, conflicts });
      }
      return results;
    },
  };
}
