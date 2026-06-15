import { ContextData, ModuleType, RouterDecision, MODULE_DESCRIPTIONS, SkinProfile } from './state';

export class OrchestratorRouter {
  private confidenceThreshold = 0.5;

  async route(context: ContextData): Promise<RouterDecision> {
    const decisions: RouterDecision[] = [];

    decisions.push(this.checkRecommendation(context));
    decisions.push(this.checkSupport(context));
    decisions.push(this.checkUpsell(context));
    decisions.push(this.checkRecovery(context));
    decisions.push(this.checkContent(context));
    decisions.push(this.checkAnalytics(context));

    decisions.sort((a, b) => b.confidence - a.confidence || b.priority - a.priority);

    const top = decisions[0];
    if (!top || top.confidence < this.confidenceThreshold) {
      return {
        module: 'fallback',
        confidence: 0.3,
        reasoning: 'No specific module matches confidently, using fallback',
        priority: 0,
      };
    }
    return top;
  }

  async routeFromEvent(eventType: string, context: ContextData): Promise<RouterDecision> {
    const eventModuleMap: Record<string, ModuleType> = {
      PRODUCT_VIEWED: 'recommendation',
      ADD_TO_CART: 'upsell',
      CHECKOUT_STARTED: 'upsell',
      PURCHASE_COMPLETED: 'analytics',
      ABANDONED_CHECKOUT: 'recovery',
      SUPPORT_TICKET_CREATED: 'support',
    };

    const mapped = eventModuleMap[eventType];
    if (mapped) {
      return {
        module: mapped,
        confidence: 0.9,
        reasoning: `Direct event-module mapping: ${eventType} → ${mapped}`,
        priority: 10,
      };
    }

    return this.route(context);
  }

  private checkRecommendation(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.skinProfile?.skinType) score.push('has_skin_type');
    if (context.skinProfile?.skinConcerns?.length) score.push('has_concerns');
    if (context.query?.match(/recommend|routine|product for|what should i use|best.*for/i)) score.push('query_match');
    if (context.eventType === 'PRODUCT_VIEWED') score.push('viewed_product');
    if (context.eventType === 'SESSION_STARTED') score.push('new_session');

    return {
      module: 'recommendation',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Recommendation match: ${score.join(', ')}` : 'No recommendation signals',
      priority: score.includes('has_concerns') ? 8 : 4,
    };
  }

  private checkSupport(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.query?.match(/help|support|return|shipping|ingredient|what is|how to|order|track|where is/i)) score.push('query_match');
    if (context.eventType === 'SUPPORT_TICKET_CREATED') score.push('ticket_created');
    if (context.query?.match(/ingredient|what does|side effect|allerg/i)) score.push('ingredient_query');

    return {
      module: 'support',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Support match: ${score.join(', ')}` : 'No support signals',
      priority: score.includes('ticket_created') ? 9 : 3,
    };
  }

  private checkUpsell(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.eventType === 'ADD_TO_CART') score.push('add_to_cart');
    if (context.eventType === 'CHECKOUT_STARTED') score.push('checkout_started');
    if (context.cartId) score.push('has_cart');
    if (context.query?.match(/upgrade|complete|also need|add.*routine|bundle/i)) score.push('query_match');

    return {
      module: 'upsell',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Upsell match: ${score.join(', ')}` : 'No upsell signals',
      priority: score.includes('checkout_started') ? 8 : 5,
    };
  }

  private checkRecovery(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.eventType === 'ABANDONED_CHECKOUT') score.push('abandoned');
    if (context.query?.match(/left.*cart|forgot|abandon|still interested|come back/i)) score.push('query_match');
    if (context.eventType === 'CART_UPDATED' && context.eventPayload?.line_items?.length) {
      if ((context.eventPayload.line_items.length > 0) && !context.eventPayload.completed_at) {
        score.push('active_cart_no_checkout');
      }
    }

    return {
      module: 'recovery',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Recovery match: ${score.join(', ')}` : 'No recovery signals',
      priority: score.includes('abandoned') ? 10 : 2,
    };
  }

  private checkContent(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.query?.match(/write|generate|create.*content|email|description|seo|blog|ad copy|campaign/i)) score.push('query_match');
    if (context.query?.match(/product description|newsletter|social media|post/i)) score.push('content_type_match');

    return {
      module: 'content',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Content match: ${score.join(', ')}` : 'No content signals',
      priority: 2,
    };
  }

  private checkAnalytics(context: ContextData): RouterDecision {
    const score: string[] = [];
    if (context.query?.match(/analytics|revenue|report|metrics|dashboard|performance|conversion|aov/i)) score.push('query_match');
    if (context.eventType === 'PURCHASE_COMPLETED') score.push('purchase');
    if (context.eventType === 'RECOMMENDATION_CLICKED') score.push('recommendation_perf');

    return {
      module: 'analytics',
      confidence: this.calcConfidence(score, 2),
      reasoning: score.length ? `Analytics match: ${score.join(', ')}` : 'No analytics signals',
      priority: score.includes('purchase') ? 7 : 1,
    };
  }

  private calcConfidence(signals: string[], maxSignals: number): number {
    if (!signals.length) return 0;
    return Math.min(signals.length / maxSignals, 1.0);
  }
}
