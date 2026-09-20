import crypto from 'crypto';
import { db } from './db.ts';
import { SubscriptionStatus, PlanId } from '../types.ts';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY || 'price_qbot2_monthly_49';
const STRIPE_PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY || 'price_qbot2_annual_470';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export const billingService = {
  async createCheckoutSession(userId: string, email: string, planId: 'monthly' | 'annual') {
    // Check if live Stripe is configured
    if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.startsWith('sk_test_...')) {
      try {
        // Real Stripe API call via native fetch to avoid heavy external SDK initialization crashes
        const priceId = planId === 'annual' ? STRIPE_PRICE_YEARLY : STRIPE_PRICE_MONTHLY;
        const params = new URLSearchParams({
          'success_url': `${APP_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${APP_URL}/pricing?checkout=cancelled`,
          'mode': 'subscription',
          'customer_email': email,
          'client_reference_id': userId,
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'metadata[userId]': userId,
          'metadata[planId]': planId,
        });

        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const session = await response.json();
        if (session.error) {
          throw new Error(session.error.message);
        }
        return {
          url: session.url,
          sessionId: session.id,
          mode: 'live_stripe'
        };
      } catch (err: any) {
        console.error('Stripe Checkout Session error:', err);
        throw new Error('Failed to create Stripe checkout session: ' + err.message);
      }
    }

    // Realistic Demo / Developer Mode Simulation:
    // Generates a mock checkout session that automatically updates the customer's entitlement
    const simulatedSessionId = 'cs_test_' + crypto.randomBytes(12).toString('hex');
    const periodDays = planId === 'annual' ? 365 : 30;

    // Simulate entitlement upgrade
    await db.updateSubscription(userId, {
      planId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + periodDays * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      maxDevices: planId === 'annual' ? 3 : 2,
      stripeCustomerId: 'cus_' + crypto.randomBytes(8).toString('hex'),
      stripeSubscriptionId: 'sub_' + crypto.randomBytes(8).toString('hex'),
      paymentMethodLast4: '4242',
      paymentMethodBrand: 'Visa'
    });

    await db.logWebhookEvent(
      simulatedSessionId,
      'checkout.session.completed',
      'processed',
      `Simulated completed checkout for user ${email} (${planId} plan)`
    );

    return {
      url: `/dashboard?checkout=success&plan=${planId}`,
      sessionId: simulatedSessionId,
      mode: 'simulated_dev'
    };
  },

  async createCustomerPortalSession(userId: string) {
    const sub = await db.getSubscription(userId);
    if (STRIPE_SECRET_KEY && sub?.stripeCustomerId && !STRIPE_SECRET_KEY.startsWith('sk_test_...')) {
      try {
        const params = new URLSearchParams({
          'customer': sub.stripeCustomerId,
          'return_url': `${APP_URL}/dashboard`
        });

        const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const session = await response.json();
        if (session.error) throw new Error(session.error.message);
        return { url: session.url };
      } catch (err: any) {
        console.error('Stripe Portal error:', err);
      }
    }

    // Fallback portal action in dev
    return {
      url: '/dashboard?portal=simulated',
      message: 'Manage subscription details directly in the Customer Dashboard.'
    };
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!STRIPE_WEBHOOK_SECRET) {
      // In dev or test environments where webhook secret is not configured, accept with logged warning
      console.warn('STRIPE_WEBHOOK_SECRET not set. Skipping cryptographic signature check.');
      return true;
    }
    if (!signatureHeader) return false;

    try {
      // Parse Stripe signature header format: t=timestamp,v1=signature
      const parts = signatureHeader.split(',');
      let timestamp = '';
      let signature = '';
      for (const part of parts) {
        const [k, v] = part.split('=');
        if (k === 't') timestamp = v;
        if (k === 'v1') signature = v;
      }
      if (!timestamp || !signature) return false;

      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      );
    } catch (err) {
      console.error('Webhook signature verification exception:', err);
      return false;
    }
  },

  async handleWebhookEvent(event: { id: string; type: string; data: { object: any } }) {
    const eventId = event.id;
    const eventType = event.type;
    const obj = event.data.object;

    // Enforce idempotency: check if already processed
    const alreadyProcessed = await db.isWebhookEventProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`Webhook event ${eventId} already processed. Skipping duplicate.`);
      return { status: 'ignored', reason: 'idempotent_duplicate' };
    }

    let summary = `Event ${eventType} recorded`;

    switch (eventType) {
      case 'checkout.session.completed': {
        const userId = obj.client_reference_id || obj.metadata?.userId;
        const planId = (obj.metadata?.planId as PlanId) || 'monthly';
        if (userId) {
          await db.updateSubscription(userId, {
            planId,
            status: 'active',
            stripeCustomerId: obj.customer,
            stripeSubscriptionId: obj.subscription,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + (planId === 'annual' ? 365 : 30) * 86400000).toISOString(),
            cancelAtPeriodEnd: false
          });
          summary = `Checkout completed for user ${userId} (${planId})`;
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const customerId = obj.customer;
        const statusMap: Record<string, SubscriptionStatus> = {
          'active': 'active',
          'trialing': 'trialing',
          'past_due': 'past_due',
          'canceled': 'canceled',
          'unpaid': 'unpaid',
          'incomplete': 'unpaid'
        };
        const status = statusMap[obj.status] || 'active';
        const currentPeriodEnd = new Date(obj.current_period_end * 1000).toISOString();
        const cancelAtPeriodEnd = obj.cancel_at_period_end || false;

        // Find user by stripeCustomerId
        for (const user of await db.getAllUsers()) {
          const sub = await db.getSubscription(user.id);
          if (sub?.stripeCustomerId === customerId) {
            await db.updateSubscription(user.id, {
              status,
              currentPeriodEnd,
              cancelAtPeriodEnd
            });
            summary = `Subscription updated for customer ${customerId} -> ${status}`;
            break;
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const customerId = obj.customer;
        for (const user of await db.getAllUsers()) {
          const sub = await db.getSubscription(user.id);
          if (sub?.stripeCustomerId === customerId) {
            await db.updateSubscription(user.id, {
              status: 'canceled',
              cancelAtPeriodEnd: true
            });
            summary = `Subscription cancelled for customer ${customerId}`;
            break;
          }
        }
        break;
      }

      case 'invoice.paid': {
        summary = `Invoice ${obj.id} paid successfully for amount ${obj.amount_paid}`;
        break;
      }

      case 'invoice.payment_failed': {
        const customerId = obj.customer;
        for (const user of await db.getAllUsers()) {
          const sub = await db.getSubscription(user.id);
          if (sub?.stripeCustomerId === customerId) {
            await db.updateSubscription(user.id, {
              status: 'past_due'
            });
            summary = `Payment failed for customer ${customerId}. Flagged as past_due.`;
            break;
          }
        }
        break;
      }

      case 'charge.refunded': {
        summary = `Charge ${obj.id} was refunded`;
        break;
      }

      default: {
        summary = `Unhandled event type ${eventType} logged`;
      }
    }

    await db.logWebhookEvent(eventId, eventType, 'processed', summary, obj);
    return { status: 'processed', summary };
  }
};
