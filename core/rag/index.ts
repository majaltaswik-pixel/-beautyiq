import { EmbeddingService } from './embeddings';
import { Retriever, InMemoryVectorStore, VectorStoreAdapter } from './retriever';
import { KnowledgeGraph } from '../knowledge_graph/relations';

export interface RAGConfig {
  embeddingApiKey?: string;
  embeddingModel?: string;
  embeddingProvider?: 'openai' | 'cohere' | 'groq' | 'mock';
  vectorStore?: VectorStoreAdapter;
  topK?: number;
  minScore?: number;
}

export class RAGSystem {
  public embeddings: EmbeddingService;
  public retriever: Retriever;
  public knowledgeGraph: KnowledgeGraph;
  private initialized = false;

  constructor(config: RAGConfig, knowledgeGraph: KnowledgeGraph) {
    const noApiKey = !config.embeddingApiKey || config.embeddingApiKey === '';
    this.embeddings = new EmbeddingService({
      provider: noApiKey ? 'mock' : (config.embeddingProvider || 'mock'),
      model: config.embeddingModel || 'mock-v1',
      dimensions: 256,
      apiKey: config.embeddingApiKey,
    });
    this.retriever = new Retriever(
      this.embeddings,
      config.vectorStore || new InMemoryVectorStore(),
      {
        embeddingService: this.embeddings,
        topK: config.topK || 10,
        minScore: config.minScore || 0.5,
      }
    );
    this.knowledgeGraph = knowledgeGraph;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async ingestProductKnowledge(product: any): Promise<void> {
    const text = `${product.title}: ${product.description || ''}`;
    await this.retriever.ingest([
      {
        id: `product:${product.shopifyId || product.id}`,
        text,
        metadata: {
          type: 'product',
          shopifyId: product.shopifyId || product.id,
          title: product.title,
          price: product.price,
          tags: product.tags,
          ingredients: product.ingredients,
        },
      },
    ]);
  }

  async ingestIngredientKnowledge(ingredient: { name: string; description: string; benefits?: string[]; category?: string }): Promise<void> {
    const benefits = (ingredient.benefits || []).join(', ');
    const text = `${ingredient.name}: ${ingredient.description} Benefits: ${benefits}`;
    await this.retriever.ingest([
      {
        id: `ingredient:${ingredient.name.toLowerCase().replace(/\s+/g, '-')}`,
        text,
        metadata: {
          type: 'ingredient',
          name: ingredient.name,
          category: ingredient.category || '',
          benefits: ingredient.benefits || [],
        },
      },
    ]);
  }

  async ingestFAQ(faq: { question: string; answer: string; category?: string }): Promise<void> {
    const text = `Q: ${faq.question}\nA: ${faq.answer}`;
    await this.retriever.ingest([
      {
        id: `faq:${Buffer.from(faq.question).toString('base64').slice(0, 40)}`,
        text,
        metadata: {
          type: 'faq',
          question: faq.question,
          category: faq.category || 'general',
        },
      },
    ]);
  }

  async query(context: string, topK?: number): Promise<any> {
    const vectorResults = await this.retriever.retrieve(context, undefined, topK);
    const semanticResults = await this.knowledgeGraph.semanticQuery({
      text: context,
      topK: topK || 5,
    });
    return {
      vectorResults,
      graphResults: semanticResults,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  async buildPrompt(query: string): Promise<{ context: string; sources: any[] }> {
    const results = await this.query(query, 10);
    const contextParts: string[] = [];
    const sources: any[] = [];

    for (const vr of results.vectorResults) {
      if (vr.score && vr.score > 0.5) {
        contextParts.push(vr.text);
        sources.push({ type: 'vector', id: vr.id, score: vr.score });
      }
    }

    for (const gr of results.graphResults) {
      contextParts.push(`${gr.type}: ${gr.label} - ${JSON.stringify(gr.properties)}`);
      sources.push({ type: 'graph', id: gr.id, nodeType: gr.type, label: gr.label });
    }

    return {
      context: contextParts.join('\n\n'),
      sources,
    };
  }
}
