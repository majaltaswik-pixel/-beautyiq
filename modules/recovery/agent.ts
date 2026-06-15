import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { RecoveryService } from './service';

export class RecoveryAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [ragContext, customerEvents, kgStats] = await Promise.all([
      tools.getRAGContext('abandoned cart recovery skincare'),
      state.context.customerId
        ? tools.getEventsByCustomer(state.context.customerId, 30)
        : Promise.resolve([]),
      tools.getGraphStats(),
    ]);

    const previousRecoveries = customerEvents.filter(
      (e) => e.type === 'RECOVERY_EMAIL_SENT' || e.type === 'RECOVERY_SMS_SENT'
    );
    const previousConversions = customerEvents.filter((e) => e.type === 'RECOVERY_CONVERTED');

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        metadata: {
          ...state.context.metadata,
          ragSources: ragContext.sources.length,
          previousRecoveryAttempts: previousRecoveries.length,
          previousRecoveryConversions: previousConversions.length,
          kgNodeCount: kgStats.totalNodes,
          recoveryScore: this.calculateRecoveryScore(previousRecoveries.length, previousConversions.length),
        },
      },
    };

    const service = new RecoveryService();
    const result = await service.process(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          ragContext: ragContext.context,
          customerRecoveryHistory: {
            attempts: previousRecoveries.length,
            conversions: previousConversions.length,
          },
          kgStats,
        },
      },
      reasoning: [
        ...result.reasoning,
        `Recovery Agent: ${previousRecoveries.length} past attempts, ${previousConversions.length} converted, ${customerEvents.length} total events`,
      ],
    };
  }

  private calculateRecoveryScore(attempts: number, conversions: number): number {
    if (attempts === 0) return 0.5;
    return Math.min(conversions / Math.max(attempts, 1), 1.0);
  }
}

export const recoveryAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new RecoveryAgent();
  return agent.process(state, tools);
};
