import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { RecommendationService } from './service';

export class RecommendationAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [ragContext, kgStats, enrichedProfile] = await Promise.all([
      tools.getRAGContext(state.context.query || 'skincare product recommendation'),
      tools.getGraphStats(),
      state.context.customerId ? tools.getSkinProfile(state.context.customerId) : Promise.resolve(null),
    ]);

    const enrichedSkinProfile = enrichedProfile || state.context.skinProfile;

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        skinProfile: enrichedSkinProfile || state.context.skinProfile,
        metadata: {
          ...state.context.metadata,
          ragSources: ragContext.sources.length,
          kgNodeCount: kgStats.totalNodes,
        },
      },
    };

    const service = new RecommendationService();
    const result = await service.recommend(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          ragSources: ragContext.sources,
          kgStats,
          profileSource: enrichedProfile ? 'shopify' : 'session',
        },
      },
      reasoning: [
        ...result.reasoning,
        `Agent: enriched with RAG (${ragContext.sources.length} sources), KG (${kgStats.totalNodes} nodes, ${kgStats.totalEdges} edges)`,
      ],
    };
  }
}

export const recommendationAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new RecommendationAgent();
  return agent.process(state, tools);
};
