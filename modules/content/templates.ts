export interface Template {
  id: string;
  name: string;
  type: string;
  category: string;
  tone: string;
  variables: string[];
  template: string;
}

export const CONTENT_TEMPLATES: Template[] = [
  {
    id: 'prod-desc-premium', name: 'Premium Product Description', type: 'product_description', category: 'product', tone: 'premium',
    variables: ['productName', 'description', 'ingredients', 'benefits', 'price'],
    template: `{{productName}}\n\n{{description}}\n\nKey Ingredients: {{ingredients}}\n\nBenefits: {{benefits}}\n\n{{price}}\n\nExperience the transformative power of science-backed skincare. Formulated with precision for your unique skin needs.`,
  },
  {
    id: 'prod-desc-clean', name: 'Clean Beauty Description', type: 'product_description', category: 'product', tone: 'clean',
    variables: ['productName', 'description', 'ingredients', 'benefits'],
    template: `{{productName}}\n\n{{description}}\n\nMade with: {{ingredients}}\n\n{{benefits}}\n\nClean, conscious, effective skincare.`,
  },
  {
    id: 'email-welcome', name: 'Welcome Email', type: 'email_campaign', category: 'email', tone: 'warm',
    variables: ['customerName', 'brandName', 'offer'],
    template: `Subject: Welcome to {{brandName}}!\n\nHi {{customerName}},\n\nWelcome to the {{brandName}} family. We're thrilled to have you!\n\nHere's {{offer}} to start your journey.\n\n[Shop Now]\n\nLove,\nThe {{brandName}} Team`,
  },
  {
    id: 'email-abandoned', name: 'Abandoned Cart Email', type: 'email_campaign', category: 'email', tone: 'gentle',
    variables: ['customerName', 'items', 'discount', 'recoveryLink'],
    template: `Subject: Your {{brandName}} cart is waiting\n\nHi {{customerName}},\n\nYou left some items behind. Your perfect routine is just a click away.\n\nItems: {{items}}\n\nUse code: {{discount}} to complete your purchase.\n\n[Complete My Order]({{recoveryLink}})`,
  },
  {
    id: 'ad-luxury', name: 'Luxury Skincare Ad', type: 'ad_copy', category: 'advertising', tone: 'luxury',
    variables: ['productName', 'brandName', 'uniqueSellingPoint'],
    template: `Experience the pinnacle of skincare science.\n\n{{productName}} by {{brandName}}\n\n{{uniqueSellingPoint}}\n\n[Discover More] #LuxurySkincare`,
  },
  {
    id: 'ad-performance', name: 'Performance Ad', type: 'ad_copy', category: 'advertising', tone: 'direct',
    variables: ['productName', 'result', 'price'],
    template: `{{result}} in 2 weeks? Yes.\n\n{{productName}} — backed by science, proven by results.\n\nStarting at {{price}}\n\n[Shop Now] #ResultsDriven`,
  },
  {
    id: 'social-glow', name: 'Social Media Glow Post', type: 'social_post', category: 'social', tone: 'playful',
    variables: ['productName', 'emoji', 'hashtags'],
    template: `Your daily dose of {{emoji}} with {{productName}}!\n\nGlow up, your way.\n\n{{hashtags}}`,
  },
  {
    id: 'social-educational', name: 'Educational Social Post', type: 'social_post', category: 'social', tone: 'informative',
    variables: ['topic', 'fact', 'productName', 'hashtags'],
    template: `Did you know? {{fact}}\n\nThat's why we love {{productName}} for {{topic}}.\n\n{{hashtags}}`,
  },
  {
    id: 'seo-guide', name: 'SEO Skincare Guide', type: 'seo_article', category: 'seo', tone: 'informative',
    variables: ['topic', 'steps', 'productRecommendations', 'expertTips'],
    template: `# The Ultimate Guide to {{topic}}\n\n## Why It Matters\n\nYour skincare routine is the foundation of healthy, radiant skin.\n\n## Key Steps\n\n{{steps}}\n\n## Product Recommendations\n\n{{productRecommendations}}\n\n## Expert Tips\n\n{{expertTips}}`,
  },
];

export function renderTemplate(templateId: string, variables: Record<string, string>): string | null {
  const template = CONTENT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  let result = template.template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export function getTemplatesByType(type: string): Template[] {
  return CONTENT_TEMPLATES.filter((t) => t.type === type);
}

export function getTemplatesByTone(tone: string): Template[] {
  return CONTENT_TEMPLATES.filter((t) => t.tone === tone);
}
