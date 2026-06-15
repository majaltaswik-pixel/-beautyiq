import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { ContentService } from './service';
import { contentHandler } from './generator';

export class ContentAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [ragContext, kgStats, productContext] = await Promise.all([
      tools.getRAGContext(state.context.query || 'content generation skincare'),
      tools.getGraphStats(),
      state.context.metadata?.productId
        ? tools.getProductById(state.context.metadata.productId)
        : Promise.resolve(null),
    ]);

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        metadata: {
          ...state.context.metadata,
          ragSources: ragContext.sources.length,
          kgNodeCount: kgStats.totalNodes,
          productTitle: productContext?.title,
          productIngredients: productContext?.ingredients,
        },
      },
    };

    const service = new ContentService();
    const result = await service.generate(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          ragContext: ragContext.context.slice(0, 300),
          kgStats,
          productContext: productContext
            ? { id: productContext.id, title: productContext.title }
            : null,
        },
      },
      reasoning: [
        ...result.reasoning,
        `Content Agent: enriched with RAG (${ragContext.sources.length} sources), KG (${kgStats.totalNodes} nodes)`,
      ],
    };
  }
}

export const contentAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new ContentAgent();
  return agent.process(state, tools);
};
