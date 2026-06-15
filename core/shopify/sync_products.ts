import { ShopifyClient } from './client';
import { ProductRepository } from '../db/products';

export interface SyncResult {
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  totalErrors: number;
  errors: Array<{ id: number; error: string }>;
}

export class ProductSyncService {
  private client: ShopifyClient;
  private repo: ProductRepository;

  constructor(client: ShopifyClient, repo: ProductRepository) {
    this.client = client;
    this.repo = repo;
  }

  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = { totalProcessed: 0, totalCreated: 0, totalUpdated: 0, totalErrors: 0, errors: [] };
    let cursor: string | undefined;
    do {
      const { products, nextCursor } = await this.client.getProducts(cursor);
      cursor = nextCursor;
      for (const product of products) {
        try {
          const normalized = this.normalize(product);
          const existing = await this.repo.findByShopifyId(product.id);
          if (existing) {
            await this.repo.update(existing.id, normalized);
            result.totalUpdated++;
          } else {
            await this.repo.create(normalized);
            result.totalCreated++;
          }
          result.totalProcessed++;
        } catch (err: any) {
          result.totalErrors++;
          result.errors.push({ id: product.id, error: err.message });
        }
      }
    } while (cursor);
    return result;
  }

  async syncSingle(productId: number): Promise<void> {
    const product = await this.client.getProduct(productId);
    const normalized = this.normalize(product);
    const existing = await this.repo.findByShopifyId(product.id);
    if (existing) {
      await this.repo.update(existing.id, normalized);
    } else {
      await this.repo.create(normalized);
    }
  }

  private normalize(product: any): any {
    const ingredients = this.extractIngredients(product);
    return {
      shopifyId: product.id,
      title: product.title,
      description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '') : '',
      tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      productType: product.product_type || '',
      vendor: product.vendor || '',
      collections: product.collections || [],
      price: parseFloat(product.variants?.[0]?.price || '0'),
      compareAtPrice: product.variants?.[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : null,
      currency: 'USD',
      imageUrl: product.image?.src || '',
      images: (product.images || []).map((img: any) => img.src),
      ingredients,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        inventoryQuantity: v.inventory_quantity || 0,
      })) || [],
      options: product.options?.map((o: any) => ({
        name: o.name,
        values: o.values,
      })) || [],
      status: product.status || 'active',
      publishedAt: product.published_at,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  private extractIngredients(product: any): string[] {
    const ingredientField = product.metafields?.find(
      (m: any) => m.namespace === 'beauty' && m.key === 'ingredients'
    );
    if (ingredientField) {
      return ingredientField.value.split(',').map((i: string) => i.trim());
    }
    const ingredientPatterns = [
      /ingredients?:?\s*([^]*?)(?:\n\n|\n#|$)/i,
      /key ingredients?:?\s*([^]*?)(?:\n\n|\n#|$)/i,
      /active ingredients?:?\s*([^]*?)(?:\n\n|\n#|$)/i,
    ];
    const body = product.body_html || '';
    for (const pattern of ingredientPatterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1].split(/[,;.\n]/).map((i: string) => i.trim().replace(/<[^>]*>/g, '')).filter(Boolean);
      }
    }
    return [];
  }
}
