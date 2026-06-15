import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { buildAbandonedCartEmail } from './email';
import { buildAbandonedCartSMS } from './sms';

export class RecoveryService {
  async process(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const checkoutData = state.context.eventPayload || state.context.metadata || {};
    const customerId = state.context.customerId;

    const cartItems = checkoutData.line_items || [];
    const customerInfo = await this.getCustomerInfo(customerId, tools);
    const skinProfile = customerId ? await tools.getSkinProfile(customerId) : null;

    const [alternativeProducts, similarProducts] = await Promise.all([
      this.findAlternatives(cartItems, skinProfile, tools),
      cartItems.length ? tools.findSimilar(`product:${cartItems[0]?.product_id}`, 4).catch(() => []) : Promise.resolve([]),
    ]);

    const personalizedMessage = this.generateMessage(customerInfo, cartItems, alternativeProducts, skinProfile);
    const channel = this.detectPreferredChannel(customerInfo);
    const discountPercent = cartItems.length > 2 ? 15 : 10;

    const normalizedItems = cartItems.map((item: any) => ({
      title: item.title || item.name || 'Product',
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity, 10) || 1,
      imageUrl: item.imageUrl || undefined,
    }));
    const emailTemplate = channel === 'email' ? buildAbandonedCartEmail(
      customerInfo.name, normalizedItems, checkoutData.total_price || checkoutData.totalPrice || 0,
      `${state.context.shopDomain || ''}/cart`, discountPercent,
      { fromName: 'BeautyIQ', fromEmail: 'hello@beautyiq.com', shopDomain: state.context.shopDomain || '', brandName: 'BeautyIQ' },
    ) : null;

    const smsTemplate = channel === 'sms' ? buildAbandonedCartSMS(
      customerInfo.name, cartItems.length,
      `${state.context.shopDomain || ''}/cart`, discountPercent,
      { fromNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890', brandName: 'BeautyIQ' },
    ) : null;

    return {
      ...state,
      action: 'cart_recovery',
      payload: {
        abandonedCart: { items: cartItems, total: checkoutData.total_price || checkoutData.totalPrice },
        customer: customerInfo,
        alternatives: alternativeProducts,
        similarProducts,
        message: personalizedMessage,
        channels: [channel],
        emailTemplate,
        smsTemplate,
        recoveryStrategy: {
          timing: '30min',
          channel,
          discount: discountPercent,
          template: channel === 'email' ? 'abandoned_cart_email' : 'abandoned_cart_sms',
        },
      },
      confidence: 0.9,
      reasoning: [...state.reasoning, `Recovery engine: ${cartItems.length} items, ${channel} channel, ${discountPercent}% discount`],
    };
  }

  private async getCustomerInfo(customerId: string | undefined, tools: OrchestratorTools): Promise<any> {
    if (!customerId) return { name: 'there', email: null, phone: null, recoveryEligible: true, pastPurchases: 0 };
    const events = await tools.getEventsByCustomer(customerId, 10);
    const customerEvent = events.find((e) => e.type === 'CUSTOMER_CREATED' || e.type === 'CUSTOMER_UPDATED');
    return {
      name: customerEvent?.data?.first_name || customerEvent?.data?.firstName || 'there',
      email: customerEvent?.data?.email || null,
      phone: customerEvent?.data?.phone || null,
      recoveryEligible: true,
      pastPurchases: events.filter((e) => e.type === 'PURCHASE_COMPLETED').length,
    };
  }

  private async findAlternatives(cartItems: any[], skinProfile: any, tools: OrchestratorTools): Promise<any[]> {
    const alternatives: any[] = [];
    for (const item of cartItems.slice(0, 3)) {
      const productId = item.product_id?.toString();
      if (!productId) continue;
      const similar = await tools.findSimilar(`product:${productId}`, 3);
      for (const node of similar) {
        alternatives.push({
          original: item.title || item.name,
          alternative: node.label,
          price: node.properties?.price,
          score: node.score || 0.5,
          reason: node.score && node.score > 0.6
            ? 'Similar product our customers love'
            : 'Compatible product that pairs well',
        });
      }
    }
    return alternatives.slice(0, 4);
  }

  private generateMessage(customer: any, cartItems: any[], alternatives: any[], skinProfile: any): string {
    const itemNames = cartItems.map((i: any) => i.title || i.name).join(', ');
    let msg = `Hi ${customer.name}! We noticed you left ${itemNames} in your cart.`;
    if (skinProfile?.skinType) msg += ` As someone with ${skinProfile.skinType} skin, `;
    msg += `Complete your routine today and get personalized skincare recommendations!`;
    if (alternatives.length) msg += ` We also found some alternatives you might love.`;
    return msg;
  }

  private detectPreferredChannel(customer: any): 'email' | 'sms' {
    if (customer.phone) return 'sms';
    return 'email';
  }
}

export const recoveryHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new RecoveryService();
  return service.process(state, tools);
};
