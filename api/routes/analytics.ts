import { LangGraphOrchestrator } from '../../core/orchestrator/graph';
import { ContextData } from '../../core/orchestrator/state';

export async function handleAnalytics(body: any, orchestrator: LangGraphOrchestrator) {
  const context: ContextData = {
    shopDomain: body.shopDomain,
    sessionId: body.sessionId,
    query: body.query || 'revenue analytics',
    metadata: {
      dateRange: body.dateRange || '30d',
      comparison: body.comparison || 'previous_period',
      metrics: body.metrics || [],
      ...body.metadata,
    },
  };

  return orchestrator.process(context);
}
