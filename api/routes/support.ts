import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleSupport(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    query: body.query,
    customerId: body.customerId,
    orderId: body.orderId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: { category: body.category, ...body.metadata },
  };

  return orchestrator.process(context);
}
