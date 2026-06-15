import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleProducts(body: any, orchestrator: LangGraphOrchestrator) {
  const action = body.action || 'list';
  const context: ContextData = {
    query: body.query || `${action} products`,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    customerId: body.customerId,
    productId: body.productId,
    metadata: {
      action,
      filters: body.filters || {},
      tags: body.tags || [],
      collection: body.collection,
      sortBy: body.sortBy || 'created_at',
      limit: body.limit || 50,
      offset: body.offset || 0,
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}

export async function handleProductSync(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    query: 'sync products from shopify',
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: {
      action: 'sync',
      fullSync: body.fullSync !== false,
      productIds: body.productIds || [],
      sinceId: body.sinceId,
      force: body.force || false,
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}
