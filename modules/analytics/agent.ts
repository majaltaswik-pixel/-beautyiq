import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { AnalyticsService } from './service';
import { analyticsHandler } from './tracker';

export class AnalyticsAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [kgStats, eventHistory, moduleStats] = await Promise.all([
      tools.getGraphStats(),
      tools.getEventHistory(),
      Promise.resolve(
        (['recommendation', 'upsell', 'recovery', 'content', 'support'] as const).map((m) => m)
      ),
    ]);

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        metadata: {
          ...state.context.metadata,
          totalEvents: eventHistory.length,
          kgNodeCount: kgStats.totalNodes,
          eventBreakdown: this.getEventBreakdown(eventHistory),
        },
      },
    };

    const service = new AnalyticsService();
    const result = await service.generate(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          kgStats,
          totalEventsProcessed: eventHistory.length,
          moduleCoverage: moduleStats.length,
        },
      },
      reasoning: [
        ...result.reasoning,
        `Analytics Agent: ${eventHistory.length} events analyzed, KG (${kgStats.totalNodes} nodes, ${kgStats.totalEdges} edges)`,
      ],
    };
  }

  private getEventBreakdown(events: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const e of events) {
      breakdown[e.type] = (breakdown[e.type] || 0) + 1;
    }
    return breakdown;
  }
}

export const analyticsAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new AnalyticsAgent();
  return agent.process(state, tools);
};
