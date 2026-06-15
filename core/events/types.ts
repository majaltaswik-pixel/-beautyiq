export const EVENT_TYPES: readonly EventType[] = [
  'PRODUCT_VIEWED', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'PURCHASE_COMPLETED',
  'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'CART_UPDATED',
  'CHECKOUT_UPDATED', 'ORDER_PAID', 'ORDER_CANCELLED', 'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'APP_UNINSTALLED', 'ABANDONED_CHECKOUT',
  'SESSION_STARTED', 'RECOMMENDATION_CLICKED', 'RECOMMENDATION_ADDED_TO_CART',
  'UPSELL_OFFERED', 'UPSELL_ACCEPTED', 'UPSELL_DECLINED',
  'SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET_RESOLVED', 'CONTENT_GENERATED',
  'RECOVERY_EMAIL_SENT', 'RECOVERY_SMS_SENT', 'RECOVERY_CONVERTED',
] as const;

export type EventType =
  | 'PRODUCT_VIEWED'
  | 'ADD_TO_CART'
  | 'CHECKOUT_STARTED'
  | 'PURCHASE_COMPLETED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'CART_UPDATED'
  | 'CHECKOUT_UPDATED'
  | 'ORDER_PAID'
  | 'ORDER_CANCELLED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'CUSTOMER_DELETED'
  | 'APP_UNINSTALLED'
  | 'ABANDONED_CHECKOUT'
  | 'SESSION_STARTED'
  | 'RECOMMENDATION_CLICKED'
  | 'RECOMMENDATION_ADDED_TO_CART'
  | 'UPSELL_OFFERED'
  | 'UPSELL_ACCEPTED'
  | 'UPSELL_DECLINED'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'CONTENT_GENERATED'
  | 'RECOVERY_EMAIL_SENT'
  | 'RECOVERY_SMS_SENT'
  | 'RECOVERY_CONVERTED';

export interface NormalizedEvent {
  type: EventType;
  source: string;
  entity: string;
  entityId: string;
  data: any;
  raw: any;
  timestamp: string;
  customerId?: string;
  sessionId?: string;
  shopDomain?: string;
}

export interface EnrichedEvent extends NormalizedEvent {
  enrichedData?: Record<string, unknown>;
}

export interface EventHandler {
  (event: NormalizedEvent): Promise<void>;
}

export interface ScheduledEvent {
  id: string;
  type: EventType;
  targetTime: Date;
  payload: NormalizedEvent;
}
