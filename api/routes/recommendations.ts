import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleRecommendations(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    skinProfile: {
      skinType: body.skinType,
      skinConcerns: body.skinConcerns || [],
      allergies: body.allergies || [],
      preferences: body.preferences || [],
      age: body.age,
      region: body.region,
    },
    query: body.query || `product recommendations for ${body.skinType || 'all'} skin`,
    customerId: body.customerId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    productId: body.productId,
    metadata: {
      count: body.count || 6,
      includeRoutine: body.includeRoutine !== false,
      includeAlternatives: body.includeAlternatives !== false,
      priceRange: body.priceRange || {},
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}

export async function handleRoutineRecommendation(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    skinProfile: {
      skinType: body.skinType,
      skinConcerns: body.skinConcerns || [],
      allergies: body.allergies || [],
      preferences: body.preferences || [],
      age: body.age,
      region: body.region,
    },
    query: 'build skincare routine',
    customerId: body.customerId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: {
      action: 'build_routine',
      timeOfDay: body.timeOfDay || 'both',
      routineLength: body.routineLength || 5,
      existingProducts: body.existingProducts || [],
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}
