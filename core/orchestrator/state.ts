import { EventType } from '../events/types';

export interface ContextData {
  userId?: string;
  shopDomain?: string;
  sessionId?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  cartId?: string;
  skinProfile?: SkinProfile;
  eventType?: EventType;
  eventPayload?: any;
  query?: string;
  metadata?: Record<string, any>;
}

export interface SkinProfile {
  skinType?: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  skinConcerns?: string[];
  allergies?: string[];
  preferences?: string[];
  currentRoutine?: string[];
  age?: number;
  region?: string;
}

export interface OrchestratorState {
  context: ContextData;
  module: ModuleType | null;
  action: string;
  payload: any;
  confidence: number;
  reasoning: string[];
  sourceModules: string[];
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export type ModuleType =
  | 'recommendation'
  | 'support'
  | 'upsell'
  | 'recovery'
  | 'content'
  | 'analytics'
  | 'fallback';

export type RouterDecision = {
  module: ModuleType;
  confidence: number;
  reasoning: string;
  priority: number;
};

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  recommendation: 'Product recommendation and routine building based on skin profile and concerns',
  support: 'Customer support including ingredient info, order tracking, shipping FAQ, routine guidance',
  upsell: 'Upsell and cross-sell recommendations based on cart contents and ingredient synergy',
  recovery: 'Abandoned cart recovery with personalized messaging and alternative product suggestions',
  content: 'Marketing content generation for product descriptions, SEO articles, email campaigns, ad copy',
  analytics: 'Revenue analytics tracking AI-attributed revenue, conversion uplift, AOV impact',
  fallback: 'General purpose handler when no specific module is clearly indicated',
};
