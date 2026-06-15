import { IngredientProfile, ProductIngestionInput, RoutineIngestionInput } from './schema';

export const SEED_INGREDIENTS: IngredientProfile[] = [
  { name: 'Hyaluronic Acid', description: 'Holds 1000x its weight in water. Provides intense hydration and plumping effect.', category: 'Humectant', benefits: ['Hydration', 'Plumping', 'Moisture Retention'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Combination', 'Sensitive', 'Oily'], compatibleWith: ['Vitamin C', 'Retinol', 'Niacinamide', 'Ceramides'], incompatibleWith: [], safetyLevel: 'safe' },
  { name: 'Retinol', description: 'Vitamin A derivative that accelerates cell turnover and stimulates collagen production.', category: 'Retinoid', benefits: ['Anti-Aging', 'Texture Improvement', 'Cell Turnover'], contraindications: ['Pregnancy', 'Eczema', 'Rosacea'], suitableSkinTypes: ['Normal', 'Oily', 'Combination'], compatibleWith: ['Hyaluronic Acid', 'Niacinamide', 'Ceramides'], incompatibleWith: ['Vitamin C', 'Benzoyl Peroxide', 'AHAs'], safetyLevel: 'caution', maxConcentration: 1.0 },
  { name: 'Vitamin C', description: 'Potent antioxidant that brightens skin, fades hyperpigmentation, and boosts collagen.', category: 'Vitamin', benefits: ['Brightening', 'Antioxidant', 'Collagen Support'], contraindications: ['Severe Acne'], suitableSkinTypes: ['Normal', 'Oily', 'Combination', 'Dry'], compatibleWith: ['Vitamin E', 'Ferulic Acid', 'Hyaluronic Acid'], incompatibleWith: ['Retinol', 'Benzoyl Peroxide'], safetyLevel: 'safe', maxConcentration: 20 },
  { name: 'Niacinamide', description: 'Vitamin B3 that reduces pore appearance, regulates oil production, and strengthens skin barrier.', category: 'Vitamin', benefits: ['Pore Reduction', 'Oil Control', 'Barrier Support', 'Redness Reduction'], contraindications: [], suitableSkinTypes: ['Oily', 'Combination', 'Normal', 'Dry'], compatibleWith: ['Retinol', 'Hyaluronic Acid', 'Ceramides', 'Zinc'], incompatibleWith: [], safetyLevel: 'safe', maxConcentration: 10 },
  { name: 'Salicylic Acid', description: 'Beta hydroxy acid (BHA) that exfoliates inside pores and treats acne.', category: 'Exfoliant', benefits: ['Acne Treatment', 'Exfoliation', 'Pore Clearing'], contraindications: ['Damaged Skin Barrier', 'Sunburn'], suitableSkinTypes: ['Oily', 'Combination'], compatibleWith: ['Niacinamide', 'Hyaluronic Acid', 'Ceramides'], incompatibleWith: ['Retinol', 'Benzoyl Peroxide'], safetyLevel: 'caution', maxConcentration: 2 },
  { name: 'Ceramides', description: 'Lipids that restore and strengthen the skin barrier, preventing moisture loss.', category: 'Lipid', benefits: ['Barrier Repair', 'Moisture Retention', 'Protection'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Sensitive', 'Combination'], compatibleWith: ['Retinol', 'Niacinamide', 'Hyaluronic Acid', 'Vitamin C'], incompatibleWith: [], safetyLevel: 'safe' },
  { name: 'Benzoyl Peroxide', description: 'Powerful antibacterial agent that kills acne-causing bacteria.', category: 'Acne Treatment', benefits: ['Acne Treatment', 'Bacteria Reduction'], contraindications: ['Sensitive Skin', 'Damaged Barrier'], suitableSkinTypes: ['Oily'], compatibleWith: ['Hyaluronic Acid', 'Ceramides'], incompatibleWith: ['Retinol', 'Vitamin C', 'Salicylic Acid'], safetyLevel: 'caution', maxConcentration: 10 },
  { name: 'Vitamin E', description: 'Fat-soluble antioxidant that protects skin from free radical damage.', category: 'Antioxidant', benefits: ['Antioxidant', 'Moisturizing', 'Healing'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Combination', 'Sensitive'], compatibleWith: ['Vitamin C', 'Ferulic Acid', 'Hyaluronic Acid'], incompatibleWith: [], safetyLevel: 'safe' },
  { name: 'Peptides', description: 'Amino acid chains that signal skin to produce more collagen and elastin.', category: 'Anti-Aging', benefits: ['Anti-Aging', 'Collagen Boost', 'Firming'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Combination', 'Sensitive', 'Oily'], compatibleWith: ['Hyaluronic Acid', 'Ceramides', 'Niacinamide'], incompatibleWith: ['Retinol (high concentration)'], safetyLevel: 'safe' },
  { name: 'Azelaic Acid', description: 'Multi-tasking acid that treats acne, rosacea, and hyperpigmentation.', category: 'Acid', benefits: ['Acne Treatment', 'Redness Reduction', 'Brightening'], contraindications: [], suitableSkinTypes: ['Oily', 'Combination', 'Normal', 'Sensitive'], compatibleWith: ['Niacinamide', 'Hyaluronic Acid', 'Ceramides'], incompatibleWith: ['Retinol'], safetyLevel: 'safe', maxConcentration: 15 },
  { name: 'SPF', description: 'Sun protection factor that shields skin from UVA/UVB damage.', category: 'Protection', benefits: ['Sun Protection', 'Anti-Aging', 'Prevention'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Oily', 'Combination', 'Sensitive'], compatibleWith: ['Vitamin C', 'Niacinamide', 'Hyaluronic Acid'], incompatibleWith: [], safetyLevel: 'safe' },
  { name: 'Glycolic Acid', description: 'Alpha hydroxy acid (AHA) that exfoliates surface skin cells.', category: 'Exfoliant', benefits: ['Exfoliation', 'Brightening', 'Texture Improvement'], contraindications: ['Active Acne', 'Sunburn'], suitableSkinTypes: ['Normal', 'Combination', 'Dry'], compatibleWith: ['Hyaluronic Acid', 'Ceramides', 'Niacinamide'], incompatibleWith: ['Retinol', 'Salicylic Acid', 'Benzoyl Peroxide'], safetyLevel: 'caution', maxConcentration: 10 },
  { name: 'Squalane', description: 'Lightweight, non-comedogenic oil that mimics skin\'s natural sebum.', category: 'Oil', benefits: ['Moisturizing', 'Non-Comedogenic', 'Barrier Support'], contraindications: [], suitableSkinTypes: ['Dry', 'Normal', 'Combination', 'Oily', 'Sensitive'], compatibleWith: ['Retinol', 'Vitamin C', 'Hyaluronic Acid', 'Ceramides'], incompatibleWith: [], safetyLevel: 'safe' },
];

export const SEED_PRODUCTS: ProductIngestionInput[] = [
  { shopifyId: 1001, title: 'Hydrating Hyaluronic Serum', description: 'Lightweight serum with hyaluronic acid for intense hydration.', ingredients: ['Hyaluronic Acid', 'Vitamin C'], skinConcerns: ['Dehydration', 'Dullness'], skinTypes: ['Dry', 'Normal', 'Combination'], benefits: ['Hydration', 'Brightening'], productType: 'Serum', brand: 'BeautyIQ', price: 42, form: 'Liquid' },
  { shopifyId: 1002, title: 'Retinol Night Treatment', description: 'Night cream with retinol for anti-aging and texture improvement.', ingredients: ['Retinol', 'Ceramides', 'Peptides'], skinConcerns: ['Aging', 'Texture'], skinTypes: ['Normal', 'Oily', 'Combination'], benefits: ['Anti-Aging', 'Texture Improvement'], productType: 'Night Cream', brand: 'BeautyIQ', price: 58, form: 'Cream' },
  { shopifyId: 1003, title: 'Vitamin C Brightening Serum', description: 'Concentrated vitamin C serum for brightening and antioxidant protection.', ingredients: ['Vitamin C', 'Vitamin E', 'Ferulic Acid'], skinConcerns: ['Hyperpigmentation', 'Dullness'], skinTypes: ['Normal', 'Oily', 'Combination'], benefits: ['Brightening', 'Antioxidant'], productType: 'Serum', brand: 'BeautyIQ', price: 48, form: 'Liquid' },
  { shopifyId: 1004, title: 'Niacinamide Pore Refining Toner', description: 'Balancing toner with niacinamide to minimize pores and control oil.', ingredients: ['Niacinamide', 'Zinc', 'Hyaluronic Acid'], skinConcerns: ['Large Pores', 'Oiliness'], skinTypes: ['Oily', 'Combination'], benefits: ['Pore Reduction', 'Oil Control'], productType: 'Toner', brand: 'BeautyIQ', price: 28, form: 'Liquid' },
  { shopifyId: 1005, title: 'Salicylic Acid Acne Treatment', description: 'Targeted acne treatment with salicylic acid for blemishes.', ingredients: ['Salicylic Acid', 'Niacinamide'], skinConcerns: ['Acne'], skinTypes: ['Oily', 'Combination'], benefits: ['Acne Treatment', 'Exfoliation'], productType: 'Treatment', brand: 'BeautyIQ', price: 22, form: 'Gel' },
  { shopifyId: 1006, title: 'Ceramide Barrier Repair Moisturizer', description: 'Rich moisturizer with ceramides to restore and protect skin barrier.', ingredients: ['Ceramides', 'Squalane', 'Hyaluronic Acid'], skinConcerns: ['Dehydration', 'Redness', 'Sensitivity'], skinTypes: ['Dry', 'Sensitive', 'Normal'], benefits: ['Barrier Repair', 'Moisturizing'], productType: 'Moisturizer', brand: 'BeautyIQ', price: 36, form: 'Cream' },
  { shopifyId: 1007, title: 'Daily SPF 40 Sunscreen', description: 'Lightweight daily SPF with broad-spectrum protection.', ingredients: ['SPF', 'Vitamin C', 'Hyaluronic Acid'], skinConcerns: ['Aging', 'Hyperpigmentation'], skinTypes: ['Dry', 'Normal', 'Oily', 'Combination', 'Sensitive'], benefits: ['Sun Protection', 'Anti-Aging'], productType: 'SPF', brand: 'BeautyIQ', price: 26, form: 'Lotion' },
  { shopifyId: 1008, title: 'Gentle Gel Cleanser', description: 'pH-balanced gel cleanser for daily face washing.', ingredients: ['Hyaluronic Acid', 'Ceramides'], skinConcerns: [], skinTypes: ['Normal', 'Combination', 'Oily'], benefits: ['Cleansing', 'Hydration'], productType: 'Cleanser', brand: 'BeautyIQ', price: 24, form: 'Gel' },
  { shopifyId: 1009, title: 'Peptide Firming Eye Cream', description: 'Eye cream with peptides to firm and reduce fine lines.', ingredients: ['Peptides', 'Ceramides', 'Hyaluronic Acid'], skinConcerns: ['Aging', 'Texture'], skinTypes: ['Dry', 'Normal', 'Combination'], benefits: ['Anti-Aging', 'Firming'], productType: 'Eye Cream', brand: 'BeautyIQ', price: 45, form: 'Cream' },
  { shopifyId: 1010, title: 'Azelaic Acid Brightening Complex', description: 'Multi-action treatment for hyperpigmentation and redness.', ingredients: ['Azelaic Acid', 'Niacinamide', 'Hyaluronic Acid'], skinConcerns: ['Hyperpigmentation', 'Redness', 'Acne'], skinTypes: ['Oily', 'Combination', 'Normal'], benefits: ['Brightening', 'Redness Reduction'], productType: 'Treatment', brand: 'BeautyIQ', price: 38, form: 'Cream' },
  { shopifyId: 1011, title: 'Squalane Hydrating Oil', description: 'Lightweight facial oil suitable for all skin types.', ingredients: ['Squalane', 'Vitamin E'], skinConcerns: ['Dehydration'], skinTypes: ['Dry', 'Normal', 'Combination', 'Sensitive'], benefits: ['Moisturizing', 'Barrier Support'], productType: 'Oil', brand: 'BeautyIQ', price: 32, form: 'Oil' },
  { shopifyId: 1012, title: 'Glycolic Acid Resurfacing Pads', description: 'Exfoliating pads with glycolic acid for smoother texture.', ingredients: ['Glycolic Acid', 'Hyaluronic Acid', 'Ceramides'], skinConcerns: ['Texture', 'Dullness'], skinTypes: ['Normal', 'Combination', 'Dry'], benefits: ['Exfoliation', 'Brightening'], productType: 'Treatment', brand: 'BeautyIQ', price: 34, form: 'Pad' },
];

export const SEED_ROUTINES: RoutineIngestionInput[] = [
  {
    name: 'Morning Glow Routine', skinTypes: ['Normal', 'Combination'], concerns: ['Dullness'],
    steps: [
      { productId: 'product:1008', stepNumber: 1, name: 'Cleanse', description: 'Start with a gentle gel cleanser to remove overnight impurities', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1003', stepNumber: 2, name: 'Vitamin C Serum', description: 'Apply brightening vitamin C serum for antioxidant protection', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1006', stepNumber: 3, name: 'Moisturize', description: 'Lock in hydration with barrier repair moisturizer', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1007', stepNumber: 4, name: 'SPF Protection', description: 'Finish with SPF 40 for sun protection', timeOfDay: 'morning', duration: 1 },
    ],
  },
  {
    name: 'Evening Repair Routine', skinTypes: ['Normal', 'Oily', 'Combination'], concerns: ['Aging', 'Texture'],
    steps: [
      { productId: 'product:1008', stepNumber: 1, name: 'Double Cleanse', description: 'First cleanse to remove makeup, second with gel cleanser', timeOfDay: 'evening', duration: 2 },
      { productId: 'product:1002', stepNumber: 2, name: 'Retinol Treatment', description: 'Apply retinol night treatment for anti-aging benefits', timeOfDay: 'evening', duration: 1 },
      { productId: 'product:1006', stepNumber: 3, name: 'Barrier Moisturizer', description: 'Seal with ceramide-rich moisturizer', timeOfDay: 'evening', duration: 1 },
    ],
  },
  {
    name: 'Acne Control Routine', skinTypes: ['Oily', 'Combination'], concerns: ['Acne'],
    steps: [
      { productId: 'product:1008', stepNumber: 1, name: 'Cleanse', description: 'Gentle gel cleanser for acne-prone skin', timeOfDay: 'both', duration: 1 },
      { productId: 'product:1005', stepNumber: 2, name: 'Acne Treatment', description: 'Apply salicylic acid treatment to active breakouts', timeOfDay: 'evening', duration: 1 },
      { productId: 'product:1004', stepNumber: 3, name: 'Niacinamide Toner', description: 'Balance oil production with niacinamide toner', timeOfDay: 'both', duration: 1 },
      { productId: 'product:1006', stepNumber: 4, name: 'Light Moisturizer', description: 'Oil-free hydration with barrier support', timeOfDay: 'both', duration: 1 },
    ],
  },
  {
    name: 'Hydration Boost Routine', skinTypes: ['Dry', 'Sensitive'], concerns: ['Dehydration', 'Redness'],
    steps: [
      { productId: 'product:1008', stepNumber: 1, name: 'Cream Cleanser', description: 'Hydrating cream cleanser for dry skin', timeOfDay: 'both', duration: 1 },
      { productId: 'product:1001', stepNumber: 2, name: 'Hyaluronic Serum', description: 'Apply hyaluronic acid to damp skin for maximum absorption', timeOfDay: 'both', duration: 1 },
      { productId: 'product:1011', stepNumber: 3, name: 'Facial Oil', description: 'Seal with squalane oil for lasting moisture', timeOfDay: 'both', duration: 1 },
      { productId: 'product:1006', stepNumber: 4, name: 'Barrier Cream', description: 'Rich ceramide cream to lock everything in', timeOfDay: 'both', duration: 1 },
    ],
  },
  {
    name: 'Brightening AM/PM Routine', skinTypes: ['Normal', 'Combination'], concerns: ['Hyperpigmentation', 'Dullness'],
    steps: [
      { productId: 'product:1008', stepNumber: 1, name: 'Cleanse (AM)', description: 'Morning cleanse', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1003', stepNumber: 2, name: 'Vitamin C (AM)', description: 'Brightening vitamin C serum', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1007', stepNumber: 3, name: 'SPF (AM)', description: 'Daily sun protection', timeOfDay: 'morning', duration: 1 },
      { productId: 'product:1008', stepNumber: 4, name: 'Cleanse (PM)', description: 'Evening cleanse', timeOfDay: 'evening', duration: 1 },
      { productId: 'product:1010', stepNumber: 5, name: 'Azelaic Acid (PM)', description: 'Multi-action brightening treatment', timeOfDay: 'evening', duration: 1 },
      { productId: 'product:1006', stepNumber: 6, name: 'Moisturize (PM)', description: 'Night hydration', timeOfDay: 'evening', duration: 1 },
    ],
  },
];
