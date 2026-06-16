import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { DEFAULT_SUPPORT_KNOWLEDGE, SupportDocument } from './rag_support';
import { generateSupportResponse } from '../../api/services/llm';

export class SupportService {
  async handle(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const query = state.context.query || '';
    const customerId = state.context.customerId;

    const intent = this.classifyIntent(query);
    const ragContext = await tools.getRAGContext(query);

    let response: string;
    let orderInfo = null;

    if (intent === 'order_tracking' && state.context.orderId) {
      orderInfo = await this.lookupOrder(state.context.orderId, tools);
    }

    const knowledgeMatch = this.searchKnowledgeBase(query, intent);
    response = this.buildResponse(intent, ragContext, query, orderInfo, knowledgeMatch);

    // LLM enhancement — generate contextual support response
    if (!response || intent === 'general') {
      try {
        const llmResponse = await generateSupportResponse(query, ragContext.context || '');
        if (llmResponse && llmResponse !== '') {
          response = llmResponse;
        }
      } catch {
        // fallback
      }
    }

    if (!response && ragContext.context) {
      response = `Here is what I found:\n${ragContext.context.slice(0, 800)}`;
    }

    if (!response) {
      response = this.fallbackResponse(intent, query);
    }

    return {
      ...state,
      action: 'support_response',
      payload: {
        intent,
        response,
        context: ragContext.context,
        orderInfo,
        knowledgeSources: knowledgeMatch?.map((d) => d.title) || [],
        suggestions: this.getFollowUpSuggestions(intent),
      },
      confidence: this.calculateConfidence(intent, !!ragContext.context, !!knowledgeMatch),
      reasoning: [...state.reasoning, `Support: ${intent} intent, ${ragContext.sources.length} RAG sources`],
    };
  }

  private classifyIntent(query: string): string {
    const lower = query.toLowerCase();
    if (lower.match(/order|tracking|ship|delivery|where is|status/)) return 'order_tracking';
    if (lower.match(/return|refund|exchange|cancel/)) return 'returns';
    if (lower.match(/ingredient|what is|chemical|compound|extract|peptide|acid|vitamin/)) return 'ingredient_info';
    if (lower.match(/routine|step|order.*use|when.*apply|how.*use|morning|night|sequence/)) return 'routine_guidance';
    if (lower.match(/shipping|cost|free|express|international/)) return 'shipping';
    if (lower.match(/allerg|reaction|irritat|safe|pregnancy|sensitive|patch test/)) return 'safety';
    return 'general';
  }

  private async lookupOrder(orderId: string, tools: OrchestratorTools): Promise<any> {
    const events = await tools.getEventsByCustomer(orderId, 10);
    const orderEvent = events.find((e) => e.entity === 'order');
    return {
      orderId,
      status: orderEvent?.data?.fulfillment_status || orderEvent?.data?.financial_status || 'processing',
      found: !!orderEvent,
      lastUpdate: orderEvent?.timestamp || null,
    };
  }

  private searchKnowledgeBase(query: string, intent: string): SupportDocument[] | null {
    const lower = query.toLowerCase();
    let docs = DEFAULT_SUPPORT_KNOWLEDGE;

    const intentTypeMap: Record<string, string> = {
      order_tracking: 'faq',
      returns: 'faq',
      shipping: 'faq',
      ingredient_info: 'ingredient',
      routine_guidance: 'guide',
      safety: 'policy',
    };

    const filterType = intentTypeMap[intent];
    if (filterType) {
      docs = docs.filter((d) => d.type === filterType);
    }

    const matched = docs.filter((d) =>
      d.tags.some((t) => lower.includes(t)) ||
      d.title.toLowerCase().includes(lower) ||
      d.category === intent
    );

    return matched.length > 0 ? matched.slice(0, 3) : null;
  }

  private buildResponse(intent: string, ragContext: any, query: string, orderInfo: any, knowledgeDocs: SupportDocument[] | null): string {
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      return knowledgeDocs.map((d) => `${d.title}: ${d.content}`).join('\n\n');
    }

    switch (intent) {
      case 'order_tracking':
        return orderInfo?.found
          ? `Your order ${orderInfo.orderId} is currently: ${orderInfo.status}${orderInfo.lastUpdate ? ` (last updated: ${new Date(orderInfo.lastUpdate).toLocaleDateString()})` : ''}. Need more details?`
          : `I'll help track your order. Could you provide your order number?`;
      case 'returns':
        return `Our return policy allows returns within 30 days of purchase. Items must be unopened and in original packaging. Refunds are processed within 5-7 business days. Would you like to start a return?`;
      case 'ingredient_info':
        return ragContext.context
          ? `Here is what I found about that ingredient:\n${ragContext.context.slice(0, 600)}`
          : `I can help with ingredient information. What specific ingredient are you asking about? I can explain retinol, vitamin C, hyaluronic acid, niacinamide, and more.`;
      case 'routine_guidance':
        return `Here is guidance on your routine:\n\nGeneral rule: apply products from thinnest to thickest consistency.\n\nAM Routine:\n1. Cleanse\n2. Vitamin C (antioxidant protection)\n3. Moisturize\n4. SPF 30+\n\nPM Routine:\n1. Double cleanse (oil + water cleanser)\n2. Tone\n3. Treatment (retinol or exfoliant 2-3x/week)\n4. Serum\n5. Night cream\n\nWould you like specific product recommendations for your skin type?`;
      case 'shipping':
        return `We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Express shipping: 1-2 business days. International: 7-14 business days.`;
      case 'safety':
        return `For safety concerns:\n- Always patch test new products 24 hours before use\n- Introduce active ingredients gradually (retinol, acids)\n- Use SPF daily when using exfoliants or retinol\n- Check ingredient lists for known allergens\n- Consult a dermatologist for persistent concerns\n\nWhat specific safety question do you have?`;
      default:
        return '';
    }
  }

  private fallbackResponse(intent: string, query: string): string {
    return `I am here to help! I can assist with:\n- Product recommendations and skincare routines\n- Order tracking and shipping information\n- Returns and refunds\n- Ingredient explanations and safety guidance\n- General skincare advice\n\nWhat would you like to know about?`;
  }

  private getFollowUpSuggestions(intent: string): string[] {
    const suggestions: Record<string, string[]> = {
      order_tracking: ['Check shipping policy', 'Start a return', 'View order history'],
      returns: ['View return policy', 'Track existing return', 'Contact support'],
      ingredient_info: ['Common ingredients explained', 'Safety guide', 'Routine building'],
      routine_guidance: ['Product recommendations', 'Morning routine', 'Evening routine'],
      shipping: ['Return policy', 'Track order', 'International shipping'],
      safety: ['Patch test guide', 'Pregnancy safe products', 'Allergen information'],
      general: ['Product recommendations', 'Routine builder', 'Ingredient guide'],
    };
    return suggestions[intent] || suggestions.general;
  }

  private calculateConfidence(intent: string, hasRag: boolean, hasKnowledge: boolean): number {
    let base = 0.5;
    if (hasKnowledge) base += 0.3;
    if (hasRag) base += 0.1;
    if (intent !== 'general') base += 0.1;
    return Math.min(base, 0.95);
  }
}

export const supportHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new SupportService();
  return service.handle(state, tools);
};
