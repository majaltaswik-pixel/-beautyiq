import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { ContentGenerator, ContentType, GeneratedContent } from './generator';
import { getTemplatesByType, renderTemplate } from './templates';

export class ContentService {
  async generate(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const query = state.context.query || '';
    const metadata = state.context.metadata || {};
    const contentType = this.detectContentType(query, metadata.type);
    const templateId = metadata.templateId;

    if (templateId) {
      const rendered = renderTemplate(templateId, metadata.variables || {});
      if (rendered) {
        return {
          ...state,
          action: 'content_generated',
          payload: {
            content: { type: contentType, title: metadata.title || 'Generated Content', body: rendered, tone: metadata.tone || 'premium', wordCount: rendered.split(/\s+/).length },
            contentType,
            templateId,
            rendered: true,
          },
          confidence: 0.9,
          reasoning: [...state.reasoning, `Content service: rendered template ${templateId}`],
        };
      }
    }

    const generator = new ContentGenerator();
    return generator.generate(state, tools);
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

  getAvailableTemplates(type?: string): any[] {
    return type ? getTemplatesByType(type) : [];
  }
}

export const contentServiceHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new ContentService();
  return service.generate(state, tools);
};
