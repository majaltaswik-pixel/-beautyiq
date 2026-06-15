import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { SupportService } from './service';

export class SupportAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [ragContext, customerHistory] = await Promise.all([
      tools.getRAGContext(state.context.query || 'customer support'),
      state.context.customerId
        ? tools.getEventsByCustomer(state.context.customerId, 20)
        : Promise.resolve([]),
    ]);

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        metadata: {
          ...state.context.metadata,
          ragSources: ragContext.sources.length,
          customerEventCount: customerHistory.length,
          previousInteractions: customerHistory
            .filter((e) => e.type === 'SUPPORT_TICKET_CREATED' || e.type === 'SUPPORT_TICKET_RESOLVED')
            .length,
        },
      },
    };

    const service = new SupportService();
    const result = await service.handle(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          ragContext: ragContext.context,
          customerHistory: {
            total: customerHistory.length,
            pastSupportTickets: customerHistory.filter((e) => e.type === 'SUPPORT_TICKET_CREATED').length,
          },
        },
      },
      reasoning: [
        ...result.reasoning,
        `Support Agent: RAG enriched (${ragContext.sources.length} sources), ${customerHistory.length} past events`,
      ],
    };
  }
}

export const supportAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new SupportAgent();
  return agent.process(state, tools);
};
