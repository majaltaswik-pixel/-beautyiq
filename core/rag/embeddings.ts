export interface EmbeddingConfig {
  provider: 'openai' | 'cohere' | 'groq' | 'mock';
  model: string;
  dimensions: number;
  apiKey?: string;
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  async generate(text: string): Promise<number[]> {
    switch (this.config.provider) {
      case 'openai':
        return this.openAIEmbed(text);
      case 'cohere':
        return this.cohereEmbed(text);
      case 'groq':
        return this.groqEmbed(text);
      case 'mock':
      default:
        return this.mockEmbed(text);
    }
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generate(t)));
  }

  private async openAIEmbed(text: string): Promise<number[]> {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: this.config.model || 'text-embedding-3-small',
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI embedding error: ${resp.statusText}`);
    const data: any = await resp.json();
    return data.data[0].embedding;
  }

  private async cohereEmbed(text: string): Promise<number[]> {
    const resp = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [text],
        model: this.config.model || 'embed-english-v3.0',
        input_type: 'search_document',
      }),
    });
    if (!resp.ok) throw new Error(`Cohere embedding error: ${resp.statusText}`);
    const data: any = await resp.json();
    return data.embeddings[0];
  }

  private async groqEmbed(text: string): Promise<number[]> {
    try {
      const resp = await fetch(`${GROQ_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.config.model || 'text-embedding-3-small',
        }),
      });
      if (!resp.ok) {
        console.warn(`[Groq Embed] API error (${resp.status}) — fallback to mock embeddings`);
        return this.mockEmbed(text);
      }
      const data: any = await resp.json();
      return data.data[0].embedding;
    } catch {
      console.warn('[Groq Embed] Request failed — fallback to mock embeddings');
      return this.mockEmbed(text);
    }
  }

  private async mockEmbed(text: string): Promise<number[]> {
    const dim = this.config.dimensions || 256;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % dim] += text.charCodeAt(i) / 255;
    }
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / mag);
  }
}
