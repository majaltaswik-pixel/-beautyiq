import { verifyWebhook } from './auth';
import { EventBus } from '../events/event_bus';
import { NormalizedEvent } from '../events/types';

export type WebhookTopic =
  | 'products/create'
  | 'products/update'
  | 'products/delete'
  | 'carts/create'
  | 'carts/update'
  | 'checkouts/create'
  | 'checkouts/update'
  | 'orders/create'
  | 'orders/updated'
  | 'orders/paid'
  | 'orders/cancelled'
  | 'customers/create'
  | 'customers/update'
  | 'customers/delete'
  | 'app/uninstalled';

export class WebhookHandler {
  private clientSecret: string;
  private eventBus: EventBus;

  constructor(clientSecret: string, eventBus: EventBus) {
    this.clientSecret = clientSecret;
    this.eventBus = eventBus;
  }

  validate(rawBody: string, hmacHeader: string): boolean {
    return verifyWebhook(rawBody, hmacHeader, this.clientSecret);
  }

  async handle(topic: WebhookTopic, payload: any): Promise<void> {
    const event = this.normalize(topic, payload);
    if (event) {
      await this.eventBus.emit(event);
    }
  }

  private normalize(topic: WebhookTopic, payload: any): NormalizedEvent | null {
    const base = {
      source: 'shopify',
      raw: payload,
      timestamp: new Date().toISOString(),
    };
    switch (topic) {
      case 'products/create':
        return { ...base, type: 'PRODUCT_CREATED', entity: 'product', entityId: payload.id.toString(), data: payload };
      case 'products/update':
        return { ...base, type: 'PRODUCT_UPDATED', entity: 'product', entityId: payload.id.toString(), data: payload };
      case 'products/delete':
        return { ...base, type: 'PRODUCT_DELETED', entity: 'product', entityId: payload.id.toString(), data: payload };
      case 'carts/create':
        return { ...base, type: 'ADD_TO_CART', entity: 'cart', entityId: payload.id?.toString() || '', data: payload };
      case 'carts/update':
        return { ...base, type: 'CART_UPDATED', entity: 'cart', entityId: payload.id?.toString() || '', data: payload };
      case 'checkouts/create':
        return { ...base, type: 'CHECKOUT_STARTED', entity: 'checkout', entityId: payload.id?.toString() || '', data: payload };
      case 'checkouts/update':
        return { ...base, type: 'CHECKOUT_UPDATED', entity: 'checkout', entityId: payload.id?.toString() || '', data: payload };
      case 'orders/create':
        return { ...base, type: 'PURCHASE_COMPLETED', entity: 'order', entityId: payload.id.toString(), data: payload };
      case 'orders/paid':
        return { ...base, type: 'ORDER_PAID', entity: 'order', entityId: payload.id.toString(), data: payload };
      case 'orders/cancelled':
        return { ...base, type: 'ORDER_CANCELLED', entity: 'order', entityId: payload.id.toString(), data: payload };
      case 'customers/create':
        return { ...base, type: 'CUSTOMER_CREATED', entity: 'customer', entityId: payload.id.toString(), data: payload };
      case 'customers/update':
        return { ...base, type: 'CUSTOMER_UPDATED', entity: 'customer', entityId: payload.id.toString(), data: payload };
      case 'customers/delete':
        return { ...base, type: 'CUSTOMER_DELETED', entity: 'customer', entityId: payload.id.toString(), data: payload };
      case 'app/uninstalled':
        return { ...base, type: 'APP_UNINSTALLED', entity: 'shop', entityId: payload.myshopify_domain || '', data: payload };
      default:
        console.warn(`Unhandled webhook topic: ${topic}`);
        return null;
    }
  }
}

export const WEBHOOK_TOPICS: WebhookTopic[] = [
  'products/create',
  'products/update',
  'products/delete',
  'carts/create',
  'carts/update',
  'checkouts/create',
  'checkouts/update',
  'orders/create',
  'orders/updated',
  'orders/paid',
  'orders/cancelled',
  'customers/create',
  'customers/update',
  'customers/delete',
  'app/uninstalled',
];
