import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleRecommend(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    skinProfile: {
      skinType: body.skinType,
      skinConcerns: body.skinConcerns || [],
      allergies: body.allergies || [],
      preferences: body.preferences || [],
      age: body.age,
      region: body.region,
    },
    query: body.query || `skincare products for ${body.skinType || 'all'} skin`,
    customerId: body.customerId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: { productId: body.productId, ...body.metadata },
  };

  return orchestrator.process(context);
}
