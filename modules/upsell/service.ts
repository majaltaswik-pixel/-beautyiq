import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { EdgeType } from '../../core/knowledge_graph/schema';
import { findApplicableBundles, calculateBundlePrice } from './logic';

export class UpsellService {
  async generate(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const cartData = state.context.eventPayload?.line_items || state.context.metadata?.cartItems || [];
    const customerId = state.context.customerId;

    const cartProductIds = cartData
      .map((item: any) => item.product_id?.toString() || item.variant_id?.toString())
      .filter(Boolean);

    const [complementary, synTraversal, routineCompletions, customerEvents] = await Promise.all([
       this.findComplementary(cartProductIds, tools),
       cartProductIds.length ? this.findSynergyPaths(cartProductIds, tools) : Promise.resolve([]),
        this.findRoutineCompletions(cartProductIds, tools),
        customerId ? tools.getEventsByCustomer(customerId) : Promise.resolve([]),
    ]);

    const purchaseHistory = customerEvents.filter((e) => e.type === 'PURCHASE_COMPLETED');
    const cartProductTypes = cartData.map((i: any) => (i.product_type || i.title || '').toLowerCase());
    const applicableBundles = findApplicableBundles(cartProductTypes);
    const bundle = this.buildBundle(complementary, routineCompletions, purchaseHistory, applicableBundles);

    const total = cartData.reduce((sum: number, item: any) =>
      sum + parseFloat(item.price || 0) * (item.quantity || 1), 0);

    return {
      ...state,
      action: 'upsell_offer',
      payload: {
        complementaryProducts: complementary.slice(0, 4),
        routineCompletions: routineCompletions.slice(0, 3),
        synergyPaths: synTraversal.slice(0, 3),
        bundles: applicableBundles.map((b) => ({
          ...b,
          bundlePrice: calculateBundlePrice(total, b.discount),
          savings: Math.round(total * b.discount * 100) / 100,
        })),
        recommendedBundle: bundle,
        cartTotal: total,
        potentialSavings: bundle.discount,
      },
      confidence: 0.82,
      reasoning: [...state.reasoning, `Upsell engine: ${complementary.length} complementary, ${routineCompletions.length} completions, ${applicableBundles.length} bundles`],
    };
  }

  private async findComplementary(cartProductIds: string[], tools: OrchestratorTools): Promise<any[]> {
    const results: any[] = [];
    const seen = new Set<string>();

    for (const id of cartProductIds) {
      const neighbors = await tools.getNeighbors(id);
      for (const { node, edge } of neighbors) {
        if (cartProductIds.includes(node.id) || seen.has(node.id)) continue;
        if ([EdgeType.COMPATIBLE_WITH, EdgeType.SYNERGIZES_WITH, EdgeType.CONTAINS, EdgeType.BENEFITS].includes(edge.type)) {
          seen.add(node.id);
          results.push({ product: node, reason: edge.type, confidence: edge.weight });
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private async findSynergyPaths(cartProductIds: string[], tools: OrchestratorTools): Promise<any[]> {
    if (cartProductIds.length < 2) return [];
    const paths = [];
    for (let i = 0; i < cartProductIds.length - 1; i++) {
      for (let j = i + 1; j < cartProductIds.length; j++) {
        const path = await tools.findGraphPath(cartProductIds[i], cartProductIds[j], 3);
        if (path) paths.push(path);
      }
    }
    return paths;
  }

  private async findRoutineCompletions(cartProductIds: string[], tools: OrchestratorTools): Promise<any[]> {
    const stages = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment'];
    const inCart: string[] = [];

    for (const id of cartProductIds) {
      const product = await tools.getProductById(id);
      if (product) inCart.push((product.productType || '').toLowerCase());
    }

    const missing = stages.filter((s) => !inCart.some((c) => c.includes(s)));
    const completions: any[] = [];

    for (const stage of missing) {
      const products = await tools.getProductsByType(stage);
      if (products.length) {
        const similar = products[0].shopifyId
          ? await tools.findSimilar(`product:${products[0].shopifyId}`, 1)
          : [];
        completions.push({
          stage,
          suggestedProduct: products[0],
          similar: similar[0] || null,
          reason: `Complete your routine with a ${stage}`,
        });
      }
    }

    return completions;
  }

  private buildBundle(complementary: any[], completions: any[], purchaseHistory: any[], rules: any[]): any {
    const items = [...complementary.slice(0, 2), ...completions.slice(0, 1)];
    if (rules.length) {
      const bestRule = rules[0];
      return {
        name: bestRule.name,
        description: bestRule.description,
        items,
        discount: bestRule.discount,
      };
    }
    const totalPrice = items.reduce((sum, item) =>
      sum + parseFloat(item.product?.properties?.price || item.suggestedProduct?.price || 15), 0);
    return {
      name: 'Complete Routine Bundle',
      items,
      totalPrice,
      discount: Math.round(totalPrice * 0.15 * 100) / 100,
      bundlePrice: Math.round(totalPrice * 0.85 * 100) / 100,
    };
  }
}

export const upsellHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new UpsellService();
  return service.generate(state, tools);
};
