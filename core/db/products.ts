export interface ProductRecord {
  id: string;
  shopId?: string;
  shopifyId: number;
  title: string;
  description: string;
  tags: string[];
  productType: string;
  vendor: string;
  collections: string[];
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string;
  images: string[];
  ingredients: string[];
  variants: any[];
  options: any[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProductRepository {
  private db: any;
  private tableName = 'products';

  constructor(db: any) {
    this.db = db;
  }

  async create(product: any): Promise<ProductRecord> {
    const query = `
      INSERT INTO ${this.tableName} (shop_id, shopify_product_id, title, description, tags, product_type, vendor, collections, price, compare_at_price, currency, image_url, images, ingredients, variants, options, status, published_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`;
    const values = [
      product.shopId || null, product.shopifyId, product.title, product.description, JSON.stringify(product.tags),
      product.productType, product.vendor, JSON.stringify(product.collections),
      product.price, product.compareAtPrice, product.currency, product.imageUrl,
      JSON.stringify(product.images), JSON.stringify(product.ingredients),
      JSON.stringify(product.variants), JSON.stringify(product.options),
      product.status, product.publishedAt, product.createdAt, product.updatedAt,
    ];
    const { rows } = await this.db.query(query, values);
    return this.mapRecord(rows[0]);
  }

  async update(id: string, product: any): Promise<ProductRecord> {
    const query = `
      UPDATE ${this.tableName} SET title = $1, description = $2, tags = $3, product_type = $4, vendor = $5,
        collections = $6, price = $7, compare_at_price = $8, currency = $9, image_url = $10, images = $11,
        ingredients = $12, variants = $13, options = $14, status = $15, updated_at = $16
      WHERE id = $17 RETURNING *`;
    const values = [
      product.title, product.description, JSON.stringify(product.tags),
      product.productType, product.vendor, JSON.stringify(product.collections),
      product.price, product.compareAtPrice, product.currency, product.imageUrl,
      JSON.stringify(product.images), JSON.stringify(product.ingredients),
      JSON.stringify(product.variants), JSON.stringify(product.options),
      product.status, product.updatedAt, id,
    ];
    const { rows } = await this.db.query(query, values);
    return this.mapRecord(rows[0]);
  }

  async findByShopDomain(shopDomain: string): Promise<ProductRecord[]> {
    const { rows } = await this.db.query(
      `SELECT p.* FROM ${this.tableName} p JOIN shops s ON p.shop_id = s.id WHERE s.myshopify_domain = $1 ORDER BY p.created_at DESC`,
      [shopDomain]
    );
    return rows.map((r: any) => this.mapRecord(r));
  }

  async findByShopifyId(shopifyId: number): Promise<ProductRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM ${this.tableName} WHERE shopify_id = $1`, [shopifyId]);
    return rows.length ? this.mapRecord(rows[0]) : null;
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return rows.length ? this.mapRecord(rows[0]) : null;
  }

  async searchByIngredients(ingredients: string[]): Promise<ProductRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE ingredients && $1`,
      [ingredients]
    );
    return rows.map(this.mapRecord);
  }

  async searchByType(productType: string): Promise<ProductRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE product_type ILIKE $1`,
      [`%${productType}%`]
    );
    return rows.map(this.mapRecord);
  }

  async searchByTags(tags: string[]): Promise<ProductRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE tags && $1`,
      [tags]
    );
    return rows.map(this.mapRecord);
  }

  async getAll(limit = 100, offset = 0): Promise<ProductRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows.map(this.mapRecord);
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  async count(): Promise<number> {
    const { rows } = await this.db.query(`SELECT COUNT(*) FROM ${this.tableName}`);
    return parseInt(rows[0].count, 10);
  }

  private mapRecord(row: any): ProductRecord {
    return {
      id: row.id,
      shopId: row.shop_id,
      shopifyId: row.shopify_product_id || row.shopify_id,
      title: row.title,
      description: row.description,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      productType: row.product_type,
      vendor: row.vendor,
      collections: typeof row.collections === 'string' ? JSON.parse(row.collections) : row.collections,
      price: parseFloat(row.price),
      compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
      currency: row.currency,
      imageUrl: row.image_url,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      ingredients: typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients,
      variants: typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
