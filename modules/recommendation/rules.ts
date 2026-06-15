export interface CompatibilityRule {
  ingredient: string;
  compatibleWith: string[];
  incompatibleWith: string[];
  skinTypes: string[];
  concerns: string[];
  maxConcentration?: number;
}

export const INGREDIENT_COMPATIBILITY: CompatibilityRule[] = [
  { ingredient: 'Vitamin C', compatibleWith: ['Vitamin E', 'Ferulic Acid', 'Hyaluronic Acid'], incompatibleWith: ['Retinol', 'Benzoyl Peroxide', 'AHAs/BHAs'], skinTypes: ['normal', 'oily', 'combination'], concerns: ['hyperpigmentation', 'dullness', 'aging'] },
  { ingredient: 'Retinol', compatibleWith: ['Hyaluronic Acid', 'Niacinamide', 'Ceramides'], incompatibleWith: ['Vitamin C', 'Benzoyl Peroxide', 'AHAs/BHAs'], skinTypes: ['normal', 'oily', 'combination'], concerns: ['aging', 'texture', 'acne'] },
  { ingredient: 'Hyaluronic Acid', compatibleWith: ['Vitamin C', 'Retinol', 'Niacinamide', 'Ceramides'], incompatibleWith: [], skinTypes: ['dry', 'normal', 'combination', 'sensitive', 'oily'], concerns: ['dehydration', 'dryness', 'aging'] },
  { ingredient: 'Niacinamide', compatibleWith: ['Retinol', 'Hyaluronic Acid', 'Ceramides', 'Zinc'], incompatibleWith: ['Vitamin C (high concentration)'], skinTypes: ['oily', 'combination', 'normal'], concerns: ['acne', 'texture', 'large pores', 'redness'] },
  { ingredient: 'Benzoyl Peroxide', compatibleWith: ['Hyaluronic Acid', 'Ceramides'], incompatibleWith: ['Retinol', 'Vitamin C', 'AHAs/BHAs'], skinTypes: ['oily'], concerns: ['acne', 'bacteria'] },
  { ingredient: 'Salicylic Acid', compatibleWith: ['Niacinamide', 'Hyaluronic Acid', 'Ceramides'], incompatibleWith: ['Retinol', 'Benzoyl Peroxide', 'Other AHAs'], skinTypes: ['oily', 'combination'], concerns: ['acne', 'texture', 'blackheads'] },
  { ingredient: 'Ceramides', compatibleWith: ['Retinol', 'Niacinamide', 'Hyaluronic Acid', 'Vitamin C'], incompatibleWith: [], skinTypes: ['dry', 'sensitive', 'normal'], concerns: ['barrier repair', 'dryness', 'sensitivity'] },
  { ingredient: 'SPF', compatibleWith: ['Vitamin C', 'Niacinamide', 'Hyaluronic Acid'], incompatibleWith: [], skinTypes: ['dry', 'normal', 'oily', 'combination', 'sensitive'], concerns: ['protection', 'aging', 'hyperpigmentation'] },
  { ingredient: 'Vitamin E', compatibleWith: ['Vitamin C', 'Ferulic Acid', 'Hyaluronic Acid'], incompatibleWith: [], skinTypes: ['dry', 'normal', 'combination'], concerns: ['aging', 'dryness', 'protection'] },
];

export function getIngredientInfo(name: string): CompatibilityRule | undefined {
  return INGREDIENT_COMPATIBILITY.find(
    (r) => r.ingredient.toLowerCase() === name.toLowerCase()
  );
}

export function findConflicts(ingredientsA: string[], ingredientsB: string[]): string[] {
  const conflicts: string[] = [];
  for (const a of ingredientsA) {
    for (const b of ingredientsB) {
      const rule = getIngredientInfo(a);
      if (rule?.incompatibleWith.some((inc) => inc.toLowerCase() === b.toLowerCase())) {
        conflicts.push(`${a} + ${b}`);
      }
    }
  }
  return conflicts;
}

export function findSynergies(ingredientsA: string[], ingredientsB: string[]): string[] {
  const synergies: string[] = [];
  for (const a of ingredientsA) {
    for (const b of ingredientsB) {
      const rule = getIngredientInfo(a);
      if (rule?.compatibleWith.some((comp) => comp.toLowerCase() === b.toLowerCase())) {
        synergies.push(`${a} + ${b}`);
      }
    }
  }
  return synergies;
}

export function isIngredientSuitable(ingredient: string, skinType: string, concerns: string[]): boolean {
  const rule = getIngredientInfo(ingredient);
  if (!rule) return true;
  if (!rule.skinTypes.includes(skinType) && !rule.skinTypes.includes('all')) {
    const allTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
    if (rule.skinTypes.length < allTypes.length) return false;
  }
  if (concerns.length && !concerns.some((c) => rule.concerns.includes(c))) return false;
  return true;
}

export const SKIN_TYPE_ROUTINES: Record<string, string[]> = {
  dry: ['Gentle Cleanser', 'Hydrating Toner', 'Hyaluronic Acid Serum', 'Rich Moisturizer', 'SPF'],
  oily: ['Gel Cleanser', 'Salicylic Acid Toner', 'Niacinamide Serum', 'Oil-Free Moisturizer', 'SPF Gel'],
  combination: ['Gentle Cleanser', 'Balancing Toner', 'Niacinamide Serum', 'Light Moisturizer', 'SPF'],
  normal: ['Cleanser', 'Toner', 'Vitamin C Serum', 'Moisturizer', 'SPF'],
  sensitive: ['Gentle Cream Cleanser', 'Soothing Toner', 'Ceramide Serum', 'Barrier Repair Moisturizer', 'Mineral SPF'],
};
