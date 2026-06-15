import { EmbeddingService } from './embeddings';

export interface VectorRecord {
  id: string;
  text: string;
  metadata: Record<string, any>;
  score?: number;
}

export interface RetrieverConfig {
  embeddingService: EmbeddingService;
  namespace?: string;
  topK?: number;
  minScore?: number;
}

export interface VectorStoreAdapter {
  upsert(vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }>): Promise<void>;
  query(values: number[], topK: number, filter?: Record<string, any>): Promise<VectorRecord[]>;
  delete(ids: string[]): Promise<void>;
  describeIndexStats(): Promise<any>;
}

export class PineconeAdapter implements VectorStoreAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async upsert(vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }>): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vectors }),
    });
    if (!resp.ok) throw new Error(`Pinecone upsert error: ${resp.statusText}`);
  }

  async query(values: number[], topK: number, filter?: Record<string, any>): Promise<VectorRecord[]> {
    const resp = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector: values, topK, filter, includeMetadata: true }),
    });
    if (!resp.ok) throw new Error(`Pinecone query error: ${resp.statusText}`);
    const data: any = await resp.json();
    return (data.matches || []).map((m: any) => ({
      id: m.id,
      text: m.metadata?.text || '',
      metadata: m.metadata || {},
      score: m.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/vectors/delete`, {
      method: 'POST',
      headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }

  async describeIndexStats(): Promise<any> {
    const resp = await fetch(`${this.baseUrl}/describe_index_stats`, {
      headers: { 'Api-Key': this.apiKey },
    });
    return resp.json();
  }
}

export class InMemoryVectorStore implements VectorStoreAdapter {
  private vectors: Map<string, { values: number[]; metadata: Record<string, any> }> = new Map();

  async upsert(vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }>): Promise<void> {
    for (const v of vectors) {
      this.vectors.set(v.id, { values: v.values, metadata: v.metadata });
    }
  }

  async query(values: number[], topK: number, filter?: Record<string, any>): Promise<VectorRecord[]> {
    const results: VectorRecord[] = [];
    for (const [id, vec] of this.vectors.entries()) {
      if (filter) {
        const matches = Object.entries(filter).every(([k, v]) => vec.metadata[k] === v);
        if (!matches) continue;
      }
      const score = this.cosineSimilarity(values, vec.values);
      results.push({ id, text: vec.metadata.text || '', metadata: vec.metadata, score });
    }
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) this.vectors.delete(id);
  }

  async describeIndexStats(): Promise<any> {
    return { totalVectorCount: this.vectors.size };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

export class Retriever {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStoreAdapter;
  private config: RetrieverConfig;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStoreAdapter, config: RetrieverConfig) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
    this.config = config;
  }

  async ingest(records: Array<{ id: string; text: string; metadata: Record<string, any> }>): Promise<void> {
    const texts = records.map((r) => r.text);
    const embeddings = await this.embeddingService.generateBatch(texts);
    const vectors = records.map((r, i) => ({
      id: r.id,
      values: embeddings[i],
      metadata: { ...r.metadata, text: r.text },
    }));
    await this.vectorStore.upsert(vectors);
  }

  async retrieve(query: string, filter?: Record<string, any>, topK?: number): Promise<VectorRecord[]> {
    const embedding = await this.embeddingService.generate(query);
    return this.vectorStore.query(embedding, topK || this.config.topK || 10, filter);
  }

  async retrieveWithThreshold(query: string, minScore: number, filter?: Record<string, any>): Promise<VectorRecord[]> {
    const results = await this.retrieve(query, filter, 50);
    return results.filter((r) => (r.score || 0) >= minScore);
  }

  async deleteRecords(ids: string[]): Promise<void> {
    await this.vectorStore.delete(ids);
  }

  async getStats(): Promise<any> {
    return this.vectorStore.describeIndexStats();
  }
}
