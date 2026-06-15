export interface BundleRule {
  id: string;
  name: string;
  triggerProducts: string[];
  recommendedProducts: string[];
  discount: number;
  minItems: number;
  description: string;
}

export const UPSELL_RULES: BundleRule[] = [
  { id: 'cleanse-routine', name: 'Complete Cleansing System', triggerProducts: ['cleanser', 'facial wash'], recommendedProducts: ['toner', 'makeup remover'], discount: 0.15, minItems: 2, description: 'Complete your cleansing routine' },
  { id: 'anti-aging-duo', name: 'Anti-Aging Power Duo', triggerProducts: ['retinol', 'vitamin c'], recommendedProducts: ['sunscreen', 'hyaluronic acid'], discount: 0.2, minItems: 2, description: 'Maximize anti-aging results' },
  { id: 'acne-kit', name: 'Acne Control Kit', triggerProducts: ['salicylic acid', 'benzoyl peroxide'], recommendedProducts: ['niacinamide', 'oil-free moisturizer'], discount: 0.15, minItems: 2, description: 'Complete acne solution' },
  { id: 'hydration-set', name: 'Hydration Boost Set', triggerProducts: ['hyaluronic acid', 'glycerin'], recommendedProducts: ['ceramide moisturizer', 'facial mist'], discount: 0.15, minItems: 2, description: 'Intense hydration system' },
  { id: 'brightening-regimen', name: 'Brightening Regimen', triggerProducts: ['vitamin c', 'niacinamide'], recommendedProducts: ['sunscreen', 'aha'], discount: 0.2, minItems: 2, description: 'Complete brightening routine' },
  { id: 'barrier-repair', name: 'Barrier Repair Bundle', triggerProducts: ['ceramide', 'peptide'], recommendedProducts: ['gentle cleanser', 'sleeping mask'], discount: 0.15, minItems: 2, description: 'Restore and protect skin barrier' },
  { id: 'travel-set', name: 'Travel Mini Set', triggerProducts: ['moisturizer', 'cleanser'], recommendedProducts: ['travel size', 'mini'], discount: 0.1, minItems: 1, description: 'Perfect travel companions' },
  { id: 'gift-set', name: 'Gift With Purchase', triggerProducts: ['serum', 'moisturizer'], recommendedProducts: ['deluxe sample', 'gift set'], discount: 0.0, minItems: 2, description: 'Complimentary gift' },
];

export function findApplicableBundles(cartProductTypes: string[]): BundleRule[] {
  const matches: BundleRule[] = [];
  for (const rule of UPSELL_RULES) {
    const matchedTriggers = rule.triggerProducts.filter((t) =>
      cartProductTypes.some((c) => c.toLowerCase().includes(t.toLowerCase()))
    );
    if (matchedTriggers.length >= rule.minItems) {
      matches.push(rule);
    }
  }
  return matches;
}

export function calculateBundlePrice(originalPrice: number, discount: number): number {
  return Math.round(originalPrice * (1 - discount) * 100) / 100;
}

export function scoreUpsellCandidate(price: number, relevanceScore: number, marginMultiplier: number = 1): number {
  return (price * relevanceScore * marginMultiplier) / 100;
}
