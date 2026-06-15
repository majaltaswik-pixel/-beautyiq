import { Request, Response } from 'express';
import { BillingService, PLANS } from '../services/billing';

const billingService = new BillingService(process.env.STRIPE_SECRET_KEY || '');

export async function handleCreateCheckout(req: Request, res: Response) {
  try {
    const { planId, billing, email } = req.body;
    if (!planId || !billing) {
      return res.status(400).json({ error: 'planId and billing are required' });
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return res.status(400).json({ error: 'billing must be monthly or annual' });
    }
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: `Unknown plan: ${planId}` });
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = await billingService.createCheckoutSession({
      planId,
      billing,
      customerEmail: email,
      successUrl: `${baseUrl}/checkout/success?plan=${planId}`,
      cancelUrl: `${baseUrl}/`,
    });

    res.json({ url });
  } catch (err: any) {
    console.error('[Billing] Checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecrets = (process.env.STRIPE_WEBHOOK_SECRET || '').split(',').map(s => s.trim()).filter(Boolean);

  if (webhookSecrets.length === 0) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: any;
  let lastErr: any;

  for (const secret of webhookSecrets) {
    try {
      event = await billingService.constructWebhookEvent(
        JSON.stringify(req.body),
        sig,
        secret
      );
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!event) {
    console.error('[Billing] Webhook verification failed with all secrets');
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('[Billing] Checkout completed:', session.metadata?.planId, session.customer);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('[Billing] Subscription event:', event.type, subscription.id, subscription.status);
        break;
      }
      default:
        console.log('[Billing] Unhandled event:', event.type);
    }

    res.json({ received: true });
}

export async function handleCreatePortal(req: Request, res: Response) {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = await billingService.createPortalSession(customerId, `${baseUrl}/`);
    res.json({ url });
  } catch (err: any) {
    console.error('[Billing] Portal error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetPlans(_req: Request, res: Response) {
  res.json({
    plans: PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      monthly: p.monthlyPrice / 100,
      annual: p.annualPrice / 100,
      setupFee: p.setupFee / 100,
    })),
  });
}
