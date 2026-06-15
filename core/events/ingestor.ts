import { EventBus } from './event_bus';
import { NormalizedEvent, EventType } from './types';
import { WebhookTopic } from '../shopify/webhooks';

export interface IngestorConfig {
  eventBus: EventBus;
  db?: {
    saveEvent: (event: NormalizedEvent) => Promise<void>;
  };
}

export class EventIngestor {
  private config: IngestorConfig;

  constructor(config: IngestorConfig) {
    this.config = config;
  }

  async ingestShopifyWebhook(topic: WebhookTopic, payload: any): Promise<void> {
    const event = this.normalizeShopifyWebhook(topic, payload);
    if (!event) return;
    await this.config.eventBus.emit(event);
    if (this.config.db) {
      await this.config.db.saveEvent(event).catch((err) => {
        console.error('Failed to persist event:', err);
      });
    }
  }

  async ingestCustomEvent(type: EventType, data: any, customerId?: string, sessionId?: string, shopDomain?: string): Promise<void> {
    const event: NormalizedEvent = {
      type,
      source: 'custom',
      entity: data.entity || 'unknown',
      entityId: data.entityId || crypto.randomUUID(),
      data,
      raw: data,
      timestamp: new Date().toISOString(),
      customerId,
      sessionId,
      shopDomain,
    };
    await this.config.eventBus.emit(event);
    if (this.config.db) {
      await this.config.db.saveEvent(event).catch((err) => {
        console.error('Failed to persist event:', err);
      });
    }
  }

  private normalizeShopifyWebhook(topic: WebhookTopic, payload: any): NormalizedEvent | null {
    const base = {
      source: 'shopify' as const,
      raw: payload,
      timestamp: new Date().toISOString(),
      shopDomain: payload.myshopify_domain || payload.shop_domain,
    };

    const mapping: Record<string, { type: EventType; entity: string; idField: string }> = {
      'products/create': { type: 'PRODUCT_CREATED', entity: 'product', idField: 'id' },
      'products/update': { type: 'PRODUCT_UPDATED', entity: 'product', idField: 'id' },
      'products/delete': { type: 'PRODUCT_DELETED', entity: 'product', idField: 'id' },
      'carts/create': { type: 'ADD_TO_CART', entity: 'cart', idField: 'id' },
      'carts/update': { type: 'CART_UPDATED', entity: 'cart', idField: 'id' },
      'checkouts/create': { type: 'CHECKOUT_STARTED', entity: 'checkout', idField: 'id' },
      'checkouts/update': { type: 'CHECKOUT_UPDATED', entity: 'checkout', idField: 'id' },
      'orders/create': { type: 'PURCHASE_COMPLETED', entity: 'order', idField: 'id' },
      'orders/paid': { type: 'ORDER_PAID', entity: 'order', idField: 'id' },
      'orders/cancelled': { type: 'ORDER_CANCELLED', entity: 'order', idField: 'id' },
      'customers/create': { type: 'CUSTOMER_CREATED', entity: 'customer', idField: 'id' },
      'customers/update': { type: 'CUSTOMER_UPDATED', entity: 'customer', idField: 'id' },
      'customers/delete': { type: 'CUSTOMER_DELETED', entity: 'customer', idField: 'id' },
      'app/uninstalled': { type: 'APP_UNINSTALLED', entity: 'shop', idField: 'myshopify_domain' },
    };

    const map = mapping[topic];
    if (!map) {
      console.warn(`No mapping for webhook topic: ${topic}`);
      return null;
    }

    const entityId = payload[map.idField]?.toString() || crypto.randomUUID();
    const customerId = payload.customer?.id?.toString() || payload.customer_id?.toString();

    const event: NormalizedEvent = {
      ...base,
      type: map.type,
      entity: map.entity,
      entityId,
      data: payload,
      customerId,
      sessionId: payload.session_id,
    };

    if (map.type === 'ADD_TO_CART' || map.type === 'CHECKOUT_STARTED') {
      event.data.cartToken = payload.token;
    }

    return event;
  }
}
