import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { SkinProfile } from '../../core/orchestrator/state';
import { GraphNode, NodeType, EdgeType } from '../../core/knowledge_graph/schema';
import { findConflicts, findSynergies, isIngredientSuitable, SKIN_TYPE_ROUTINES, getIngredientInfo } from './rules';
import { generateRecommendations } from '../../api/services/llm';

export class RecommendationService {
  async recommend(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const profile: SkinProfile = state.context.skinProfile || state.context.metadata?.skinProfile || {};
    const query = state.context.query || '';
    const shopDomain = state.context.shopDomain;
    const searchText = `${profile.skinType || ''} ${(profile.skinConcerns || []).join(' ')} ${query}`.trim();

    const [ragResults, kgProducts, ingredientSynergies, dbProducts] = await Promise.all([
      tools.queryRAG(searchText || 'skincare products', 10),
      tools.getGraphNodesByType('Product').then((all: GraphNode[]) => this.filterBySkinType(all, profile)),
      profile.allergies?.length ? tools.findIngredientSynergies(profile.allergies) : Promise.resolve([]),
      shopDomain ? tools.productRepo.findByShopDomain(shopDomain.includes('myshopify.com') ? shopDomain : shopDomain + '.myshopify.com').catch(() => []) : Promise.resolve([]),
    ]);

    const vectorProducts = ragResults?.vectorResults || [];
    const candidates = [
      ...vectorProducts.map((v: any) => ({ ...v, source: 'vector' })),
      ...kgProducts.map((n: GraphNode) => ({
        ...n, source: 'graph',
        metadata: {
          title: n.label, price: n.properties?.price,
          ingredients: n.properties?.ingredients || [],
          tags: n.properties?.tags || [],
          productType: n.properties?.productType || '',
        },
      })),
      ...(dbProducts || []).map((p: any) => ({
        id: p.id, source: 'db',
        metadata: {
          title: p.title, price: p.price, shopifyId: p.shopifyId,
          ingredients: p.ingredients || [], tags: p.tags || [],
          productType: p.productType || '', imageUrl: p.imageUrl,
        },
      })),
    ];

    const deduped = this.deduplicate(candidates);
    const scored = this.scoreWithRules(deduped, profile);
    const compatible = this.applyIngredientRules(scored, profile);
    let topProducts = compatible.slice(0, 6);

    // LLM enhancement layer — re-rank top candidates with real AI
    if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const llmRanked = await generateRecommendations(topProducts, profile);
        if (llmRanked && llmRanked.length > 0) {
          topProducts = llmRanked.slice(0, 6);
        }
      } catch {
        // fallback to rule-based score
      }
    }

    const routine = await this.buildRoutineFromRules(profile, topProducts, tools);
    const alternatives = topProducts.length > 0
      ? await tools.findSimilar(topProducts[0].id || `product:${topProducts[0].metadata?.title}`, 3).catch(() => [])
      : [];

    return {
      ...state,
      action: 'product_recommendation',
      payload: {
        recommendations: topProducts.map((p) => ({
          product: { id: p.id, title: p.metadata?.title || p.label, price: p.metadata?.price, imageUrl: p.metadata?.imageUrl || p.imageUrl || p.properties?.imageUrl || '' },
          score: p.score,
          matchReasons: p.matchReasons || [],
          ingredientAnalysis: this.analyzeIngredients(p, profile),
        })),
        alternatives,
        routine,
        ingredientInfo: ingredientSynergies,
        explanation: this.buildExplanation(profile, topProducts, routine),
        skinProfile: profile,
        source: topProducts.some(p => p.source === 'ai') ? 'ai' : 'rule',
      },
      confidence: this.calculateConfidence(topProducts, profile),
      reasoning: [...state.reasoning, `Recommendation: ${topProducts.length} products, ${routine.length} steps`],
    };
  }

  private filterBySkinType(products: GraphNode[], profile: SkinProfile): GraphNode[] {
    if (!profile.skinType) return products;
    return products.filter((p) => {
      const types: string[] = p.properties?.skinTypes || [];
      return types.length === 0 || types.some((t) => t.toLowerCase() === profile.skinType!.toLowerCase());
    });
  }

  private deduplicate(items: any[]): any[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.id || item.metadata?.shopifyId || item.metadata?.title || item.label;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private scoreWithRules(products: any[], profile: SkinProfile): any[] {
    return products.map((p) => {
      let score = 0.5;
      const matchReasons: string[] = [];
      const tags: string[] = p.metadata?.tags || p.properties?.tags || [];
      const ingredients: string[] = p.metadata?.ingredients || p.properties?.ingredients || [];

      if (profile.skinConcerns?.length) {
        const concernMatch = profile.skinConcerns.filter((c) =>
          tags.some((t: string) => t.toLowerCase().includes(c.toLowerCase())) ||
          ingredients.some((i: string) => i.toLowerCase().includes(c.toLowerCase()))
        ).length;
        score += concernMatch * 0.15;
        if (concernMatch > 0) matchReasons.push(`Targets ${concernMatch} skin concerns`);
      }

      if (profile.skinType) {
        const suitable = ingredients.every((i: string) => isIngredientSuitable(i, profile.skinType!, profile.skinConcerns || []));
        if (suitable) {
          score += 0.2;
          matchReasons.push(`Suitable for ${profile.skinType} skin`);
        }
        const skinTypes: string[] = p.properties?.skinTypes || [];
        if (skinTypes.some((t: string) => t.toLowerCase() === profile.skinType!.toLowerCase())) {
          score += 0.1;
        }
      }

      if (profile.allergies?.length) {
        const hasAllergen = profile.allergies.some((a) =>
          ingredients.some((i: string) => i.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAllergen) {
          score += 0.1;
          matchReasons.push('No known allergens detected');
        }
      }

      if (ingredients.length > 0) {
        const synergyCount = findSynergies(ingredients, ingredients).length;
        if (synergyCount > 0) {
          score += Math.min(synergyCount * 0.05, 0.15);
          matchReasons.push(`${synergyCount} ingredient synergies`);
        }
      }

      return { ...p, score: Math.min(score, 1.0), matchReasons };
    }).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  }

  private applyIngredientRules(products: any[], profile: SkinProfile): any[] {
    if (!profile.allergies?.length && !profile.skinConcerns?.length) return products;
    return products.filter((p: any) => {
      const ingredients: string[] = p.metadata?.ingredients || p.properties?.ingredients || [];
      if (!ingredients.length) return true;

      if (profile.allergies?.length) {
        const hasAllergen = profile.allergies.some((a) =>
          ingredients.some((i: string) => i.toLowerCase().includes(a.toLowerCase()))
        );
        if (hasAllergen) return false;
      }

      if (profile.skinType) {
        const allSuitable = ingredients.every((i: string) => {
          const rule = getIngredientInfo(i);
          if (!rule) return true;
          return rule.skinTypes.includes(profile.skinType!) || rule.skinTypes.length === 5;
        });
        if (!allSuitable && ingredients.length > 0) {
          p.score = Math.max((p.score || 0) - 0.2, 0);
        }
      }

      return true;
    });
  }

  private async buildRoutineFromRules(profile: SkinProfile, topProducts: any[], tools: OrchestratorTools): Promise<any[]> {
    if (!profile.skinType && !profile.skinConcerns?.length) {
      return this.buildGenericRoutine(topProducts);
    }

    const graphRoutines = await tools.getGraphNodesByType('Routine').then((routines: GraphNode[]) => {
      return routines.filter((r) => {
        const st = r.properties?.skinTypes || [];
        if (!profile.skinType || !st.length) return true;
        return st.some((t: string) => t.toLowerCase() === profile.skinType!.toLowerCase());
      });
    });

    if (graphRoutines.length > 0) {
      const steps = await tools.getNeighbors(graphRoutines[0].id, EdgeType.STEP_OF);
      if (steps.length > 0) {
        return steps
          .sort((a: any, b: any) => (a.edge.properties?.order || 0) - (b.edge.properties?.order || 0))
          .map((s: any) => ({
            step: s.edge.properties?.order,
            name: s.node.label,
            description: s.node.properties?.description || '',
            timeOfDay: s.node.properties?.timeOfDay || 'both',
            reason: s.edge.properties?.reason || `Step ${s.edge.properties?.order} of routine`,
          }));
      }
    }

    const routineNames = SKIN_TYPE_ROUTINES[profile.skinType || 'normal'] || SKIN_TYPE_ROUTINES.normal;
    return routineNames.map((name, i) => {
      const product = topProducts.find((p) => this.productMatchesStep(p, name));
      return {
        step: i + 1,
        name,
        product: product || null,
        reason: product ? `Recommended ${product.metadata?.title || ''} for ${name.toLowerCase()}` : `Use a ${name.toLowerCase()} suited to your skin type`,
      };
    });
  }

  private buildGenericRoutine(topProducts: any[]): any[] {
    const defaultSteps = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF'];
    return defaultSteps.map((name, i) => {
      const product = topProducts.find((p) => this.productMatchesStep(p, name));
      return { step: i + 1, name, product: product || null, reason: `Complete your routine with ${name}` };
    });
  }

  private productMatchesStep(product: any, stepName: string): boolean {
    const type = (product.metadata?.productType || product.properties?.productType || '').toLowerCase();
    const title = (product.metadata?.title || product.label || '').toLowerCase();
    const sn = stepName.toLowerCase();
    return type.includes(sn) || title.includes(sn);
  }

  private analyzeIngredients(product: any, profile: SkinProfile): { compatible: string[]; conflicts: string[]; synergies: string[] } {
    const ingredients: string[] = product.metadata?.ingredients || product.properties?.ingredients || [];
    const compatible = ingredients.filter((i: string) => {
      if (!profile.skinType) return true;
      return isIngredientSuitable(i, profile.skinType!, profile.skinConcerns || []);
    });
    const conflicts = profile.allergies?.length
      ? findConflicts(ingredients, profile.allergies)
      : [];
    const synergies = findSynergies(ingredients, ingredients);
    return { compatible, conflicts, synergies };
  }

  private buildExplanation(profile: SkinProfile, products: any[], routine: any[]): string {
    const parts: string[] = ['Personalized Recommendation:'];
    if (profile.skinType) parts.push(`Skin Type: ${profile.skinType}`);
    if (profile.skinConcerns?.length) parts.push(`Concerns: ${profile.skinConcerns.join(', ')}`);
    if (products.length > 0) {
      const top = products[0];
      parts.push(`Top Match: ${top.metadata?.title || top.label} (${Math.round((top.score || 0) * 100)}% match)`);
      if (top.matchReasons?.length) {
        parts.push(`Why: ${top.matchReasons.join(', ')}`);
      }
    }
    if (routine.length > 0) parts.push(`Routine: ${routine.length} steps`);
    parts.push('Recommendations powered by ingredient compatibility analysis and AI.');
    return parts.join('\n');
  }

  private calculateConfidence(products: any[], profile: SkinProfile): number {
    if (!products.length) return 0.3;
    let base = 0.7;
    if (profile.skinType) base += 0.1;
    if (profile.skinConcerns?.length) base += 0.05;
    if (products[0]?.score && products[0].score > 0.7) base += 0.05;
    return Math.min(base, 0.95);
  }
}

export const recommendationHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new RecommendationService();
  return service.recommend(state, tools);
};
