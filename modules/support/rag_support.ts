export interface SupportDocument {
  id: string;
  type: 'faq' | 'policy' | 'guide' | 'ingredient';
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export const DEFAULT_SUPPORT_KNOWLEDGE: SupportDocument[] = [
  { id: 'faq-001', type: 'faq', title: 'Return Policy', content: 'We accept returns within 30 days of purchase. Products must be unused and in original packaging. Refunds are processed within 5-7 business days.', category: 'returns', tags: ['return', 'refund', 'money back'] },
  { id: 'faq-002', type: 'faq', title: 'Shipping Times', content: 'Standard shipping: 3-5 business days. Express shipping: 1-2 business days. International: 7-14 business days. Free shipping on orders over $50.', category: 'shipping', tags: ['shipping', 'delivery', 'time'] },
  { id: 'faq-003', type: 'faq', title: 'Order Tracking', content: 'Track your order using the tracking number sent to your email. Orders typically ship within 24 hours.', category: 'orders', tags: ['tracking', 'order status', 'where is my order'] },
  { id: 'faq-004', type: 'faq', title: 'Product Expiry', content: 'All products have a shelf life of 12-24 months from manufacture date. Check the PAO (Period After Opening) symbol on packaging.', category: 'products', tags: ['expiry', 'shelf life', 'freshness'] },
  { id: 'guide-001', type: 'guide', title: 'Morning Skincare Routine', content: '1. Cleanse with gentle cleanser\n2. Apply toner\n3. Vitamin C serum\n4. Moisturize\n5. Apply SPF 30+ sunscreen', category: 'routine', tags: ['morning', 'routine', 'day'] },
  { id: 'guide-002', type: 'guide', title: 'Evening Skincare Routine', content: '1. Double cleanse (oil cleanser + water cleanser)\n2. Tone\n3. Treatment (retinol or exfoliant, 2-3x/week)\n4. Serum\n5. Night cream/moisturizer', category: 'routine', tags: ['evening', 'night', 'routine'] },
  { id: 'ingredient-001', type: 'ingredient', title: 'Retinol Guide', content: 'Retinol is a vitamin A derivative that speeds cell turnover. Start with low concentration (0.25%) 2x/week. Always use SPF in AM. Not safe during pregnancy.', category: 'ingredients', tags: ['retinol', 'vitamin a', 'anti-aging'] },
  { id: 'ingredient-002', type: 'ingredient', title: 'Vitamin C Guide', content: 'Vitamin C is a potent antioxidant that brightens skin and protects from free radicals. Best used in AM. Store in dark, cool place. Look for L-ascorbic acid form.', category: 'ingredients', tags: ['vitamin c', 'antioxidant', 'brightening'] },
  { id: 'ingredient-003', type: 'ingredient', title: 'Hyaluronic Acid Guide', content: 'Hyaluronic Acid holds 1000x its weight in water. Apply to damp skin for best results. Works with all skin types. Safe for sensitive skin.', category: 'ingredients', tags: ['hyaluronic acid', 'hydration', 'moisture'] },
  { id: 'ingredient-004', type: 'ingredient', title: 'Niacinamide Guide', content: 'Niacinamide (Vitamin B3) reduces pore appearance, regulates oil, and strengthens skin barrier. Use 2-5% concentration for best results. Pairs well with most ingredients.', category: 'ingredients', tags: ['niacinamide', 'vitamin b3', 'pores'] },
  { id: 'policy-001', type: 'policy', title: 'Allergen Policy', content: 'We list all ingredients on product pages. Products may contain common allergens. Patch test recommended 24 hours before use. Consult dermatologist for specific allergies.', category: 'safety', tags: ['allergens', 'safety', 'patch test'] },
  { id: 'policy-002', type: 'policy', title: 'Pregnancy Safety', content: 'Avoid retinol, high-dose salicylic acid, and certain essential oils during pregnancy. Consult your healthcare provider before starting new skincare.', category: 'safety', tags: ['pregnancy', 'safe', 'precaution'] },
];


