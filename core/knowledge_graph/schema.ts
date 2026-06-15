export enum NodeType {
  Ingredient = 'Ingredient',
  SkinType = 'SkinType',
  SkinConcern = 'SkinConcern',
  Product = 'Product',
  Routine = 'Routine',
  RoutineStep = 'RoutineStep',
  Brand = 'Brand',
  Category = 'Category',
  Benefit = 'Benefit',
  RoutineTime = 'RoutineTime',
  ProductForm = 'ProductForm',
  ConcernSeverity = 'ConcernSeverity',
}

export enum EdgeType {
  CONTAINS = 'CONTAINS',
  BENEFITS = 'BENEFITS',
  CONTRAINDICATED = 'CONTRAINDICATED',
  TREATS = 'TREATS',
  SUITABLE_FOR = 'SUITABLE_FOR',
  STEP_OF = 'STEP_OF',
  FOLLOWED_BY = 'FOLLOWED_BY',
  COMPATIBLE_WITH = 'COMPATIBLE_WITH',
  INCOMPATIBLE_WITH = 'INCOMPATIBLE_WITH',
  BELONGS_TO = 'BELONGS_TO',
  SIMILAR_TO = 'SIMILAR_TO',
  SYNERGIZES_WITH = 'SYNERGIZES_WITH',
  HAS_BENEFIT = 'HAS_BENEFIT',
  HAS_CONCERN = 'HAS_CONCERN',
  USED_IN = 'USED_IN',
  REQUIRES = 'REQUIRES',
}

export const EDGE_WEIGHTS: Record<EdgeType, number> = {
  [EdgeType.CONTAINS]: 1.0,
  [EdgeType.BENEFITS]: 0.9,
  [EdgeType.CONTRAINDICATED]: 0.0,
  [EdgeType.TREATS]: 0.9,
  [EdgeType.SUITABLE_FOR]: 0.8,
  [EdgeType.STEP_OF]: 0.7,
  [EdgeType.FOLLOWED_BY]: 0.6,
  [EdgeType.COMPATIBLE_WITH]: 0.8,
  [EdgeType.INCOMPATIBLE_WITH]: 0.0,
  [EdgeType.BELONGS_TO]: 0.5,
  [EdgeType.SIMILAR_TO]: 0.7,
  [EdgeType.SYNERGIZES_WITH]: 0.9,
  [EdgeType.HAS_BENEFIT]: 0.8,
  [EdgeType.HAS_CONCERN]: 0.7,
  [EdgeType.USED_IN]: 0.6,
  [EdgeType.REQUIRES]: 0.4,
};

export const NODE_TYPE_METADATA: Record<NodeType, { description: string; color: string; icon: string }> = {
  [NodeType.Ingredient]: { description: 'Active cosmetic ingredient', color: '#10b981', icon: '🧪' },
  [NodeType.SkinType]: { description: 'Skin type classification', color: '#8b5cf6', icon: '👤' },
  [NodeType.SkinConcern]: { description: 'Skin concern or condition', color: '#ef4444', icon: '⚠️' },
  [NodeType.Product]: { description: 'Shopify product', color: '#3b82f6', icon: '📦' },
  [NodeType.Routine]: { description: 'Skincare routine sequence', color: '#f59e0b', icon: '📋' },
  [NodeType.RoutineStep]: { description: 'Single step in a routine', color: '#f97316', icon: '➡️' },
  [NodeType.Brand]: { description: 'Product brand', color: '#ec4899', icon: '🏷️' },
  [NodeType.Category]: { description: 'Product category', color: '#6366f1', icon: '📂' },
  [NodeType.Benefit]: { description: 'Desired skincare benefit', color: '#14b8a6', icon: '✨' },
  [NodeType.RoutineTime]: { description: 'Time of day for routine', color: '#a855f7', icon: '🕐' },
  [NodeType.ProductForm]: { description: 'Product formulation type', color: '#06b6d4', icon: '💧' },
  [NodeType.ConcernSeverity]: { description: 'Severity level of concern', color: '#f43f5e', icon: '📊' },
};

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, any>;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
  score?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  properties: Record<string, any>;
  createdAt: string;
}

export interface KnowledgeGraphQuery {
  nodeType?: NodeType;
  nodeIds?: string[];
  edgeType?: EdgeType;
  labels?: string[];
  properties?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SemanticQuery {
  text: string;
  nodeTypes?: NodeType[];
  topK?: number;
  minScore?: number;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  score: number;
}

export interface TraversalRule {
  edgeTypes: EdgeType[];
  maxDepth: number;
  direction: 'outbound' | 'inbound' | 'both';
  minEdgeWeight?: number;
}

export interface IngredientProfile {
  name: string;
  description: string;
  category: string;
  benefits: string[];
  contraindications: string[];
  suitableSkinTypes: string[];
  compatibleWith: string[];
  incompatibleWith: string[];
  safetyLevel: 'safe' | 'caution' | 'avoid';
  maxConcentration?: number;
  source?: string;
}

export interface ProductIngestionInput {
  shopifyId: number;
  title: string;
  description: string;
  ingredients: string[];
  skinConcerns?: string[];
  skinTypes?: string[];
  benefits?: string[];
  productType?: string;
  brand?: string;
  price: number;
  imageUrl?: string;
  tags?: string[];
  vendor?: string;
  form?: string;
}

export interface RoutineIngestionInput {
  name: string;
  steps: Array<{
    productId: string;
    stepNumber: number;
    name: string;
    description: string;
    timeOfDay?: 'morning' | 'evening' | 'both';
    duration?: number;
  }>;
  skinTypes?: string[];
  concerns?: string[];
}

export type NodeValidationResult = { valid: true; node: Partial<GraphNode> } | { valid: false; errors: string[] };
