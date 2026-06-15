import { GraphNode, NodeType, GraphEdge, EdgeType, ProductIngestionInput, IngredientProfile, RoutineIngestionInput } from './schema';
import { KnowledgeGraph } from './relations';
import crypto from 'crypto';

export interface IngestionReport {
  success: boolean;
  nodesCreated: number;
  edgesCreated: number;
  errors: Array<{ item: string; error: string }>;
  duration: number;
}

export class KnowledgeIngestor {
  private graph: KnowledgeGraph;
  private progressCallback?: (current: number, total: number, label: string) => void;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  onProgress(cb: (current: number, total: number, label: string) => void): void {
    this.progressCallback = cb;
  }

  // ── Single product ingestion ──

  async ingestProduct(input: ProductIngestionInput): Promise<{ node: GraphNode; edges: GraphEdge[] }> {
    const node = this.createProductNode(input);
    await this.graph.addNode(node);
    const edges: GraphEdge[] = [];

    for (const ing of input.ingredients || []) {
      const ingNode = await this.ensureNode(ing, NodeType.Ingredient);
      edges.push(this.createEdge(node.id, ingNode.id, EdgeType.CONTAINS, { role: 'ingredient' }));
    }
    for (const concern of input.skinConcerns || []) {
      const concernNode = await this.ensureNode(concern, NodeType.SkinConcern);
      edges.push(this.createEdge(node.id, concernNode.id, EdgeType.TREATS, { concern }));
    }
    for (const skinType of input.skinTypes || []) {
      const typeNode = await this.ensureNode(skinType, NodeType.SkinType);
      edges.push(this.createEdge(node.id, typeNode.id, EdgeType.SUITABLE_FOR, { skinType }));
    }
    for (const benefit of input.benefits || []) {
      const benefitNode = await this.ensureNode(benefit, NodeType.Benefit);
      edges.push(this.createEdge(node.id, benefitNode.id, EdgeType.HAS_BENEFIT, { benefit }));
    }
    if (input.productType) {
      const catNode = await this.ensureNode(input.productType, NodeType.Category);
      edges.push(this.createEdge(node.id, catNode.id, EdgeType.BELONGS_TO, { category: input.productType }));
    }
    if (input.brand) {
      const brandNode = await this.ensureNode(input.brand, NodeType.Brand);
      edges.push(this.createEdge(node.id, brandNode.id, EdgeType.BELONGS_TO, { role: 'brand' }));
    }
    if (input.form) {
      const formNode = await this.ensureNode(input.form, NodeType.ProductForm);
      edges.push(this.createEdge(node.id, formNode.id, EdgeType.BELONGS_TO, { form: input.form }));
    }

    await this.graph.addEdges(edges);
    return { node, edges };
  }

  async ingestProducts(inputs: ProductIngestionInput[]): Promise<IngestionReport> {
    const start = Date.now();
    const report: IngestionReport = { success: true, nodesCreated: 0, edgesCreated: 0, errors: [], duration: 0 };
    for (let i = 0; i < inputs.length; i++) {
      try {
        this.progressCallback?.(i + 1, inputs.length, inputs[i].title);
        const { node, edges } = await this.ingestProduct(inputs[i]);
        report.nodesCreated++;
        report.edgesCreated += edges.length;
      } catch (err: any) {
        report.errors.push({ item: inputs[i].title, error: err.message });
      }
    }
    report.duration = Date.now() - start;
    report.success = report.errors.length === 0;
    return report;
  }

  // ── Ingredient ingestion ──

  async ingestIngredient(profile: IngredientProfile): Promise<{ node: GraphNode; edges: GraphEdge[] }> {
    const node = this.createNode(NodeType.Ingredient, profile.name, {
      description: profile.description,
      category: profile.category,
      safetyLevel: profile.safetyLevel,
      maxConcentration: profile.maxConcentration,
      source: profile.source,
    });
    await this.graph.addNode(node);
    const edges: GraphEdge[] = [];

    for (const benefit of profile.benefits) {
      const bn = await this.ensureNode(benefit, NodeType.Benefit);
      edges.push(this.createEdge(node.id, bn.id, EdgeType.HAS_BENEFIT, { benefit }));
    }
    for (const contra of profile.contraindications) {
      const cn = await this.ensureNode(contra, NodeType.SkinConcern);
      edges.push(this.createEdge(node.id, cn.id, EdgeType.CONTRAINDICATED, { contraindication: contra }));
    }
    for (const st of profile.suitableSkinTypes) {
      const sn = await this.ensureNode(st, NodeType.SkinType);
      edges.push(this.createEdge(node.id, sn.id, EdgeType.SUITABLE_FOR, { skinType: st }));
    }
    for (const comp of profile.compatibleWith) {
      const existing = await this.graph.findByLabelAndType(comp, NodeType.Ingredient);
      if (existing) edges.push(this.createEdge(node.id, existing.id, EdgeType.COMPATIBLE_WITH, {}));
    }
    for (const incompat of profile.incompatibleWith) {
      const existing = await this.graph.findByLabelAndType(incompat, NodeType.Ingredient);
      if (existing) edges.push(this.createEdge(node.id, existing.id, EdgeType.INCOMPATIBLE_WITH, {}));
    }

    await this.graph.addEdges(edges);
    return { node, edges };
  }

  async ingestIngredients(profiles: IngredientProfile[]): Promise<IngestionReport> {
    const start = Date.now();
    const report: IngestionReport = { success: true, nodesCreated: 0, edgesCreated: 0, errors: [], duration: 0 };
    for (let i = 0; i < profiles.length; i++) {
      try {
        this.progressCallback?.(i + 1, profiles.length, profiles[i].name);
        const { node, edges } = await this.ingestIngredient(profiles[i]);
        report.nodesCreated++;
        report.edgesCreated += edges.length;
      } catch (err: any) {
        report.errors.push({ item: profiles[i].name, error: err.message });
      }
    }
    report.duration = Date.now() - start;
    report.success = report.errors.length === 0;
    return report;
  }

  // ── Routine ingestion ──

  async ingestRoutine(input: RoutineIngestionInput): Promise<{ node: GraphNode; edges: GraphEdge[] }> {
    const routineNode = this.createNode(NodeType.Routine, input.name, {
      totalSteps: input.steps.length,
      description: input.steps.map((s) => s.name).join(' → '),
      skinTypes: input.skinTypes || [],
      concerns: input.concerns || [],
    });
    await this.graph.addNode(routineNode);
    const edges: GraphEdge[] = [];

    for (const step of input.steps) {
      const stepNode = this.createNode(NodeType.RoutineStep, step.name, {
        stepNumber: step.stepNumber,
        description: step.description,
        timeOfDay: step.timeOfDay || 'both',
        duration: step.duration || 1,
      });
      await this.graph.addNode(stepNode);
      edges.push(this.createEdge(stepNode.id, routineNode.id, EdgeType.STEP_OF, { order: step.stepNumber }));
      edges.push(this.createEdge(stepNode.id, step.productId, EdgeType.USED_IN, {}));

      if (step.timeOfDay) {
        const timeNode = await this.ensureNode(
          step.timeOfDay === 'morning' ? 'Morning' : step.timeOfDay === 'evening' ? 'Evening' : 'Any',
          NodeType.RoutineTime,
        );
        edges.push(this.createEdge(stepNode.id, timeNode.id, EdgeType.BELONGS_TO, { timeOfDay: step.timeOfDay }));
      }
    }

    for (let i = 0; i < input.steps.length - 1; i++) {
      const fromId = `routinestep:${this.hash(input.steps[i].name)}`;
      const toId = `routinestep:${this.hash(input.steps[i + 1].name)}`;
      const existingFrom = await this.graph.findByLabelAndType(input.steps[i].name, NodeType.RoutineStep);
      const existingTo = await this.graph.findByLabelAndType(input.steps[i + 1].name, NodeType.RoutineStep);
      if (existingFrom && existingTo) {
        edges.push(this.createEdge(existingFrom.id, existingTo.id, EdgeType.FOLLOWED_BY, {
          order: input.steps[i].stepNumber,
        }));
      }
    }

    if (input.skinTypes) {
      for (const st of input.skinTypes) {
        const sn = await this.ensureNode(st, NodeType.SkinType);
        edges.push(this.createEdge(routineNode.id, sn.id, EdgeType.SUITABLE_FOR, { skinType: st }));
      }
    }

    await this.graph.addEdges(edges);
    return { node: routineNode, edges };
  }

  // ── Bulk CSV/JSON import ──

  async importFromJSON(data: {
    products?: ProductIngestionInput[];
    ingredients?: IngredientProfile[];
    routines?: RoutineIngestionInput[];
  }): Promise<{ products: IngestionReport; ingredients: IngestionReport; routines: IngestionReport }> {
    const products = data.products?.length ? await this.ingestProducts(data.products) : { success: true, nodesCreated: 0, edgesCreated: 0, errors: [], duration: 0 };
    const ingredients = data.ingredients?.length ? await this.ingestIngredients(data.ingredients) : { success: true, nodesCreated: 0, edgesCreated: 0, errors: [], duration: 0 };
    const routines = data.routines?.length ? await Promise.all(data.routines.map((r) => this.ingestRoutine(r).then(() => ({ success: true })).catch((e) => ({ success: false, error: e.message })))) : [];
    return {
      products,
      ingredients,
      routines: { success: routines.every((r: any) => r.success), nodesCreated: 0, edgesCreated: 0, errors: routines.filter((r: any) => !r.success).map((r: any) => ({ item: 'routine', error: r.error })), duration: 0 },
    };
  }

  // ── Private helpers ──

  private async ensureNode(label: string, type: NodeType): Promise<GraphNode> {
    const existing = await this.graph.findByLabelAndType(label, type);
    if (existing) return existing;
    const node = this.createNode(type, label, {});
    await this.graph.addNode(node);
    return node;
  }

  private createNode(type: NodeType, label: string, properties: Record<string, any>): GraphNode {
    return {
      id: `${type.toLowerCase()}:${this.hash(label)}`,
      type,
      label,
      properties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private createEdge(source: string, target: string, type: EdgeType, properties: Record<string, any>): GraphEdge {
    return {
      id: crypto.randomUUID(),
      source,
      target,
      type,
      weight: properties.weight ?? 1.0,
      properties,
      createdAt: new Date().toISOString(),
    };
  }

  private createProductNode(input: ProductIngestionInput): GraphNode {
    return {
      id: `product:${input.shopifyId}`,
      type: NodeType.Product,
      label: input.title,
      properties: {
        shopifyId: input.shopifyId,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl || '',
        tags: input.tags || [],
        vendor: input.vendor || '',
        ingredients: input.ingredients,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private hash(str: string): string {
    return crypto.createHash('md5').update(str.toLowerCase().replace(/\s+/g, '-')).digest('hex').slice(0, 12);
  }
}
