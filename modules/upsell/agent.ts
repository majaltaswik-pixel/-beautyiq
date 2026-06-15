import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { UpsellService } from './service';

export class UpsellAgent {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const [kgStats, customerHistory, cartProductIds] = await Promise.all([
      tools.getGraphStats(),
      state.context.customerId
        ? tools.getEventsByCustomer(state.context.customerId, 20)
        : Promise.resolve([]),
      Promise.resolve(
        (state.context.eventPayload?.line_items || state.context.metadata?.cartItems || [])
          .map((item: any) => item.product_id?.toString() || item.variant_id?.toString())
          .filter(Boolean)
      ),
    ]);

    let synergyPaths: { productCount: number; pathCount?: number } = { productCount: 0 };
    if (cartProductIds.length >= 2) {
      const paths = await tools.findGraphPaths(cartProductIds[0], cartProductIds[1], 3);
      synergyPaths = { productCount: cartProductIds.length, pathCount: paths?.length || 0 };
    }

    const enrichedState: OrchestratorState = {
      ...state,
      context: {
        ...state.context,
        metadata: {
          ...state.context.metadata,
          kgNodeCount: kgStats.totalNodes,
          kgEdgeCount: kgStats.totalEdges,
          customerPurchaseCount: customerHistory.filter((e) => e.type === 'PURCHASE_COMPLETED').length,
          synergyPaths,
        },
      },
    };

    const service = new UpsellService();
    const result = await service.generate(enrichedState, tools);

    return {
      ...result,
      payload: {
        ...result.payload,
        agentMetadata: {
          kgStats,
          customerHistoryLength: customerHistory.length,
          cartProductIds,
        },
      },
      reasoning: [
        ...result.reasoning,
        `Upsell Agent: KG (${kgStats.totalNodes} nodes), ${customerHistory.length} customer events, ${cartProductIds.length} cart items`,
      ],
    };
  }
}

export const upsellAgentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const agent = new UpsellAgent();
  return agent.process(state, tools);
};
