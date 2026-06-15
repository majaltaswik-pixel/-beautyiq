import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleRecovery(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    customerId: body.customerId,
    cartId: body.cartId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    eventType: 'ABANDONED_CHECKOUT',
    eventPayload: {
      line_items: body.cartItems || [],
      total_price: body.totalPrice,
      checkout_id: body.checkoutId,
      token: body.cartToken,
      ...body.checkoutData,
    },
    metadata: { recoveryChannel: body.channel, discountOverride: body.discount, ...body.metadata },
  };

  return orchestrator.process(context);
}
