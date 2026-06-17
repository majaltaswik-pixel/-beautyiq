import { getSession } from './auth';

export class ShopifyClient {
  private shop: string;
  private apiVersion: string;

  constructor(shop: string, apiVersion = '2024-10') {
    this.shop = shop;
    this.apiVersion = apiVersion;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const session = getSession(this.shop);
    if (!session) throw new Error(`No active session for shop: ${this.shop}`);
    const resp = await fetch(`https://${this.shop}/admin/api/${this.apiVersion}/${path}`, {
      method,
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '');
      throw new Error(`Shopify API error: ${resp.status} ${resp.statusText} — ${bodyText.slice(0, 500)}`);
    }
    return resp.json() as Promise<T>;
  }

  async getProducts(cursor?: string): Promise<{ products: any[]; nextCursor?: string }> {
    let path = 'products.json?limit=250';
    if (cursor) path += `&page_info=${cursor}`;
    const data = await this.request<any>('GET', path);
    const linkHeader = ''; // would parse from response headers in production
    return { products: data.products };
  }

  async getProduct(id: number): Promise<any> {
    return this.request<any>('GET', `products/${id}.json`);
  }

  async getOrders(cursor?: string): Promise<{ orders: any[]; nextCursor?: string }> {
    let path = 'orders.json?limit=250&status=any';
    if (cursor) path += `&page_info=${cursor}`;
    const data = await this.request<any>('GET', path);
    return { orders: data.orders };
  }

  async getCustomers(cursor?: string): Promise<{ customers: any[]; nextCursor?: string }> {
    let path = 'customers.json?limit=250';
    if (cursor) path += `&page_info=${cursor}`;
    const data = await this.request<any>('GET', path);
    return { customers: data.customers };
  }

  async getCarts(cursor?: string): Promise<{ carts: any[]; nextCursor?: string }> {
    let path = 'carts.json?limit=250';
    if (cursor) path += `&page_info=${cursor}`;
    const data = await this.request<any>('GET', path);
    return { carts: data.carts };
  }

  async getCheckouts(cursor?: string): Promise<{ checkouts: any[]; nextCursor?: string }> {
    let path = 'checkouts.json?limit=250';
    if (cursor) path += `&page_info=${cursor}`;
    const data = await this.request<any>('GET', path);
    return { checkouts: data.checkouts };
  }

  async getCollections(): Promise<any[]> {
    const data = await this.request<any>('GET', 'custom_collections.json?limit=250');
    return data.custom_collections;
  }

  async getMetafields(ownerResource: string, ownerId: number): Promise<any[]> {
    const data = await this.request<any>('GET', `metafields.json?metafield[owner_resource]=${ownerResource}&metafield[owner_id]=${ownerId}`);
    return data.metafields;
  }

  async createWebhook(topic: string, address: string): Promise<any> {
    return this.request<any>('POST', 'webhooks.json', {
      webhook: { topic, address, format: 'json' },
    });
  }

  async getWebhooks(): Promise<any[]> {
    const data = await this.request<any>('GET', 'webhooks.json?limit=250');
    return data.webhooks;
  }

  async deleteWebhook(id: number): Promise<void> {
    await this.request<any>('DELETE', `webhooks/${id}.json`);
  }

  async createScriptTag(src: string, displayScope: string = 'all'): Promise<any> {
    return this.request<any>('POST', 'script_tags.json', {
      script_tag: { src, display_scope: displayScope },
    });
  }

  async getScriptTags(): Promise<any> {
    return this.request<any>('GET', 'script_tags.json?limit=250');
  }

  async deleteScriptTag(id: number): Promise<void> {
    await this.request<any>('DELETE', `script_tags/${id}.json`);
  }

  async getShopInfo(): Promise<any> {
    return this.request<any>('GET', 'shop.json');
  }

  async getCustomer(id: number): Promise<any> {
    return this.request<any>('GET', `customers/${id}.json`);
  }

  async searchCustomers(query: string): Promise<any[]> {
    const data = await this.request<any>('GET', `customers/search.json?query=${encodeURIComponent(query)}`);
    return data.customers;
  }

  async createCustomer(input: any): Promise<any> {
    return this.request<any>('POST', 'customers.json', { customer: input });
  }

  async orderRisk(id: number, risk: any): Promise<any> {
    return this.request<any>('POST', `orders/${id}/risks.json`, { risk });
  }

  async getProductVariants(productId: number): Promise<any[]> {
    const data = await this.request<any>('GET', `products/${productId}/variants.json`);
    return data.variants;
  }

  async updateProduct(id: number, data: any): Promise<any> {
    return this.request<any>('PUT', `products/${id}.json`, { product: data });
  }

  async getInventoryLevel(locationId: number, inventoryItemId: number): Promise<any> {
    return this.request<any>('GET', `inventory_levels.json?location_ids=${locationId}&inventory_item_ids=${inventoryItemId}`);
  }
}
