import Stripe from 'stripe';
type StripeInstance = ReturnType<typeof Stripe>;

export interface PlanConfig {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  setupFee: number;
}

export const PLANS: PlanConfig[] = [
  { id: 'starter', name: 'Starter', monthlyPrice: 9700, annualPrice: 7800, setupFee: 0 },
  { id: 'growth', name: 'Growth', monthlyPrice: 19700, annualPrice: 15800, setupFee: 19700 },
  { id: 'scale', name: 'Scale', monthlyPrice: 29700, annualPrice: 23800, setupFee: 29700 },
];

export class BillingService {
  private stripe: StripeInstance;

  constructor(secretKey: string) {
    this.stripe = Stripe(secretKey);
  }

  async createCheckoutSession(params: {
    planId: string;
    billing: 'monthly' | 'annual';
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    const plan = PLANS.find((p) => p.id === params.planId);
    if (!plan) throw new Error(`Unknown plan: ${params.planId}`);

    const unitAmount = params.billing === 'annual' ? plan.annualPrice * 12 : plan.monthlyPrice;
    const interval: 'month' | 'year' = params.billing === 'annual' ? 'year' : 'month';

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `${plan.name} — ${params.billing === 'annual' ? 'Annual' : 'Monthly'}` },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ];

    if (plan.setupFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `${plan.name} — One-time Setup Fee` },
          unit_amount: plan.setupFee,
        },
        quantity: 1,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { planId: params.planId, billing: params.billing },
    });

    return session.url!;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async constructWebhookEvent(payload: string, signature: string, webhookSecret: string): Promise<any> {
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
