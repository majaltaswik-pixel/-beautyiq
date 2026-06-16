import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { generateContent } from '../../api/services/llm';

export type ContentType = 'product_description' | 'seo_article' | 'email_campaign' | 'ad_copy' | 'social_post';

export interface GeneratedContent {
  type: ContentType;
  title: string;
  body: string;
  seoMetadata?: { metaTitle: string; metaDescription: string; keywords: string[] };
  tone: string;
  wordCount: number;
}

export class ContentGenerator {
  async generate(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const query = state.context.query || '';
    const metadata = state.context.metadata || {};

    const contentType = this.detectContentType(query, metadata.type);
    const tone = metadata.tone || 'premium';
    const productContext = await this.getProductContext(metadata, tools);

    // Try LLM first
    if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const llmResult = await generateContent(query, tone || 'professional');
        if (llmResult && llmResult.title && llmResult.body) {
          const content: GeneratedContent = {
            type: contentType,
            title: llmResult.title,
            body: llmResult.body,
            tone,
            wordCount: llmResult.body.split(/\s+/).length,
            seoMetadata: llmResult.seoMetadata || undefined,
          };
          return {
            ...state,
            action: 'content_generated',
            payload: { content, contentType, tone, wordCount: content.wordCount, source: 'ai' },
            confidence: 0.9,
            reasoning: [...state.reasoning, `Content engine: LLM generated ${contentType}`],
          };
        }
      } catch {
        // fallback to rule-based
      }
    }

    let content: GeneratedContent;

    switch (contentType) {
      case 'product_description':
        content = this.generateProductDescription(productContext, tone);
        break;
      case 'seo_article':
        content = this.generateSEOArticle(query, productContext);
        break;
      case 'email_campaign':
        content = this.generateEmailCampaign(query, metadata);
        break;
      case 'ad_copy':
        content = this.generateAdCopy(productContext, tone);
        break;
      case 'social_post':
        content = this.generateSocialPost(productContext, tone);
        break;
      default:
        content = this.generateProductDescription(productContext, tone);
    }

    return {
      ...state,
      action: 'content_generated',
      payload: {
        content,
        contentType,
        tone,
        wordCount: content.wordCount,
      },
      confidence: 0.85,
      reasoning: [...state.reasoning, `Content engine: generated ${contentType} in ${tone} tone`],
    };
  }

  private detectContentType(query: string, explicitType?: string): ContentType {
    if (explicitType) return explicitType as ContentType;
    const lower = query.toLowerCase();
    if (lower.match(/product description|describe/i)) return 'product_description';
    if (lower.match(/seo|blog|article|guide/i)) return 'seo_article';
    if (lower.match(/email|newsletter|campaign/i)) return 'email_campaign';
    if (lower.match(/ad|facebook|instagram|google.*ad/i)) return 'ad_copy';
    if (lower.match(/social|post|tweet|instagram/i)) return 'social_post';
    return 'product_description';
  }

  private async getProductContext(metadata: any, tools: OrchestratorTools): Promise<any> {
    if (metadata.productId) {
      return tools.getProductById(metadata.productId);
    }
    return null;
  }

  private generateProductDescription(product: any, tone: string): GeneratedContent {
    const title = product?.title || 'Premium Skincare Product';
    const desc = product?.description || 'A carefully formulated skincare product designed for visible results.';
    const ingredients = product?.ingredients || [];
    const body = tone === 'premium'
      ? `${title}\n\n${desc}\n\nKey Ingredients: ${ingredients.join(', ')}\n\nExperience the transformative power of science-backed skincare. Formulated with precision for your unique skin needs.`
      : `${title}\n\n${desc}\n\nMade with: ${ingredients.join(', ')}\n\nThe perfect addition to your daily routine.`;

    return { type: 'product_description', title, body, tone, wordCount: body.split(/\s+/).length };
  }

  private generateSEOArticle(query: string, product: any): GeneratedContent {
    const title = `The Ultimate Guide to ${query || 'Skincare Routine Optimization'}`;
    const body = `# ${title}\n\n## Why Your Skincare Routine Matters\n\nA consistent skincare routine is the foundation of healthy, radiant skin. In this guide, we'll walk through the essential steps and product choices for optimal results.\n\n## Key Steps\n\n1. **Cleanse**: Start with a gentle cleanser suited to your skin type\n2. **Treat**: Apply targeted serums for your specific concerns\n3. **Moisturize**: Lock in hydration with the right moisturizer\n4. **Protect**: Always finish with SPF in the morning\n\n## Product Recommendations\n\n${product ? `**${product.title}** - ${product.description?.slice(0, 100)}` : 'Choose products based on your skin type and concerns.'}\n\n## Expert Tips\n\n- Patch test new products\n- Introduce active ingredients gradually\n- Adjust routine seasonally\n\n*Powered by BeautyIQ Revenue System™*`;
    const metaDescription = `Complete guide to ${query || 'skincare routines'}. Learn expert tips, product recommendations, and build your perfect routine.`;
    return { type: 'seo_article', title, body, tone: 'informative', wordCount: body.split(/\s+/).length, seoMetadata: { metaTitle: title, metaDescription, keywords: [query, 'skincare', 'routine', 'beauty', 'skin health'] } };
  }

  private generateEmailCampaign(query: string, metadata: any): GeneratedContent {
    const campaignName = metadata.campaignName || 'Skincare Update';
    const body = `Subject: Your Personalized Skincare Routine Awaits\n\nPreview: Discover products curated for your unique skin needs\n\nHi there,\n\nAt Beautyiq, we believe great skin starts with the right routine. We've curated a selection of products based on your preferences.\n\n**Your Personalized Picks**\n- Science-backed formulations\n- Dermatologist-approved ingredients\n- Visible results, guaranteed\n\n[Shop Now] →\n\nLove your skin,\nThe Beautyiq Team\n\nP.S. Complete your routine today and enjoy free shipping!`;
    return { type: 'email_campaign', title: campaignName, body, tone: 'warm', wordCount: body.split(/\s+/).length };
  }

  private generateAdCopy(product: any, tone: string): GeneratedContent {
    const productName = product?.title || 'Premium Skincare';
    const body = tone === 'luxury'
      ? `Experience the pinnacle of skincare science. ${productName} — where innovation meets nature.\n\n[Shop Now] #LuxurySkincare #BeautyIQ`
      : `Transform your skin with ${productName}. Visible results in 2 weeks. ✨\n\n[Try Now] #Skincare #Results`;
    return { type: 'ad_copy', title: `Ad: ${productName}`, body, tone, wordCount: body.split(/\s+/).length };
  }

  private generateSocialPost(product: any, tone: string): GeneratedContent {
    const productName = product?.title || 'your new favorite skincare';
    const body = tone === 'premium'
      ? `Elevate your routine with ${productName}. ✨\n\nScience-backed. Dermatologist-approved. Results-driven.\n\n#BeautyIQ #Skincare #PremiumBeauty`
      : `Obsessed with ${productName}! 😍\n\nYour skin deserves the best. Try it today!\n\n#SkincareRoutine #GlowUp #BeautyIQ`;
    return { type: 'social_post', title: `Social: ${productName}`, body, tone, wordCount: body.split(/\s+/).length };
  }
}

export const contentHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const generator = new ContentGenerator();
  return generator.generate(state, tools);
};
