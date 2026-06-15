export interface Shop {
  id: string;
  myshopifyDomain: string;
  accessToken: string;
  scope: string | null;
  installedAt: Date;
  uninstalledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  shopId: string;
  shopifyCustomerId: number | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  tags: string[];
  note: string | null;
  totalSpent: number;
  ordersCount: number;
  lastOrderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  shopId: string;
  shopifyProductId: number;
  title: string;
  description: string | null;
  tags: string[];
  productType: string | null;
  vendor: string | null;
  collections: string[];
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  images: string[];
  ingredients: string[];
  variants: any[];
  options: any[];
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  benefits: string[];
  contraindications: string[];
  suitableSkinTypes: string[];
  safetyLevel: string;
  concentrationMax: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductIngredient {
  id: string;
  productId: string;
  ingredientId: string;
  concentration: number | null;
  role: string | null;
}

export interface SkinProfile {
  id: string;
  userId: string;
  shopifyCustomerId: number | null;
  skinType: string | null;
  skinConcerns: string[];
  allergies: string[];
  preferences: string[];
  currentRoutine: string[];
  age: number | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppEvent {
  id: string;
  shopId: string;
  eventType: string;
  entity: string | null;
  entityId: string | null;
  customerId: string | null;
  sessionId: string | null;
  source: string;
  data: any;
  raw: any;
  enrichedData: any;
  createdAt: Date;
}

export interface Cart {
  id: string;
  shopId: string;
  shopifyCartId: string | null;
  userId: string | null;
  shopifyCustomerId: number | null;
  token: string | null;
  lineItems: any[];
  totalPrice: number | null;
  currency: string;
  abandonedAt: Date | null;
  recoveredAt: Date | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  shopId: string;
  shopifyOrderId: number;
  userId: string | null;
  shopifyCustomerId: number | null;
  email: string | null;
  totalPrice: number;
  subtotalPrice: number;
  totalDiscounts: number;
  currency: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  lineItems: any[];
  aiAttributed: boolean;
  attributionModule: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

export interface Recommendation {
  id: string;
  shopId: string;
  userId: string | null;
  shopifyCustomerId: number | null;
  sessionId: string | null;
  module: string;
  inputData: any;
  outputData: any;
  products: any[];
  clicked: boolean;
  converted: boolean;
  clickTimestamp: Date | null;
  conversionTimestamp: Date | null;
  revenue: number | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  shopId: string;
  userId: string | null;
  shopifyCustomerId: number | null;
  sessionId: string | null;
  module: string | null;
  messages: any[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeGraphNode {
  id: string;
  nodeType: string;
  label: string;
  properties: any;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: string;
  weight: number;
  properties: any;
  createdAt: Date;
}

export type ModelMap = {
  shops: Shop;
  users: User;
  products: Product;
  ingredients: Ingredient;
  product_ingredients: ProductIngredient;
  skin_profiles: SkinProfile;
  events: AppEvent;
  carts: Cart;
  orders: Order;
  recommendations: Recommendation;
  conversations: Conversation;
  knowledge_graph_nodes: KnowledgeGraphNode;
  knowledge_graph_edges: KnowledgeGraphEdge;
};
