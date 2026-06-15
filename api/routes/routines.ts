import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleRoutines(body: any, orchestrator: LangGraphOrchestrator) {
  const action = body.action || 'get';
  const context: ContextData = {
    query: body.query || `${action} skincare routine`,
    skinProfile: {
      skinType: body.skinType,
      skinConcerns: body.skinConcerns || [],
      allergies: body.allergies || [],
      preferences: body.preferences || [],
      age: body.age,
      region: body.region,
    },
    customerId: body.customerId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: {
      action,
      routineId: body.routineId,
      routineName: body.routineName,
      timeOfDay: body.timeOfDay,
      steps: body.steps || [],
      productIds: body.productIds || [],
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}

export async function handleRoutineSteps(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    query: body.query || 'get routine steps',
    customerId: body.customerId,
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    metadata: {
      action: 'get_steps',
      routineId: body.routineId,
      ordered: body.ordered !== false,
      productDetails: body.productDetails !== false,
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}
