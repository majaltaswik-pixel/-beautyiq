import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleUpsell(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    customerId: body.customerId,
    cartId: body.cartId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    eventType: body.eventType || 'ADD_TO_CART',
    eventPayload: body.cartData || body.eventPayload,
    metadata: { cartItems: body.cartItems, total: body.total, ...body.metadata },
  };

  return orchestrator.process(context);
}
