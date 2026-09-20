import crypto from 'crypto';
import { db } from '../db.ts';
import {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSessionResult,
  WebhookProcessingResult,
  CustomerPortalResult
} from './types.ts';
import { SubscriptionStatus, PlanId } from '../../types.ts';

export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay' as const;

  private get keyId(): string | undefined {
    return process.env.RAZORPAY_KEY_ID;
  }

  private get keySecret(): string | undefined {
    return process.env.RAZORPAY_KEY_SECRET;
  }

  private get webhookSecret(): string | undefined {
    return process.env.RAZORPAY_WEBHOOK_SECRET;
  }

  private get monthlyPlanId(): string {
    return process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_QBot2Monthly49';
  }

  private get yearlyPlanId(): string {
    return process.env.RAZORPAY_YEARLY_PLAN_ID || 'plan_QBot2Yearly470';
  }

  private isLiveConfigured(): boolean {
    const kid = this.keyId;
    const ksec = this.keySecret;
    return !!(
      kid &&
      ksec &&
      !kid.startsWith('rzp_test_placeholder') &&
      !kid.includes('YourRazorpay') &&
      ksec !== 'replace_with_razorpay_key_secret'
    );
  }

  /**
   * Create Razorpay Subscription or simulated checkout session
   */
  async createSubscription(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const { userId, email, name, planId } = params;
    const razorpayPlanId = planId === 'annual' ? this.yearlyPlanId : this.monthlyPlanId;
    const amount = planId === 'annual' ? 47000 : 4900; // in cents or paise ($49 / $470)
    const currency = 'USD'; // Or INR depending on merchant currency
    const totalCycles = planId === 'annual' ? 5 : 60; // 5 years or 5 years monthly

    if (this.isLiveConfigured()) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan_id: razorpayPlanId,
            total_count: totalCycles,
            quantity: 1,
            customer_notify: 1,
            notes: {
              userId,
              email,
              planId,
              customerName: name || email
            }
          })
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.description || data.error.message || 'Razorpay subscription creation failed.');
        }

        const subscriptionId = data.id;
        const checkoutUrl = data.short_url || `/dashboard?checkout=success&sub_id=${subscriptionId}&plan=${planId}`;

        // Save pending/trial subscription state in database
        await db.updateSubscription(userId, {
          planId,
          status: 'pending',
          provider: 'razorpay',
          razorpaySubscriptionId: subscriptionId,
          razorpayPlanId,
          maxDevices: planId === 'annual' ? 3 : 2
        });

        return {
          provider: 'razorpay',
          subscriptionId,
          checkoutUrl,
          keyId: this.keyId,
          planId,
          amount,
          currency,
          name: 'QBot2 Trading Platform',
          description: `${planId === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
          notes: { userId, planId, email },
          mode: 'live'
        };
      } catch (err: any) {
        console.error('Razorpay live subscription error:', err);
        throw new Error('Failed to create Razorpay subscription: ' + err.message);
      }
    }

    // Realistic Demo / Development Simulation:
    // Generates a mock Razorpay subscription ID (e.g. sub_rzp_live_...) and automatically activates entitlement
    const simulatedSubId = 'sub_rzp_' + crypto.randomBytes(8).toString('hex');
    const simulatedCustId = 'cust_rzp_' + crypto.randomBytes(6).toString('hex');
    const periodDays = planId === 'annual' ? 365 : 30;

    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date(Date.now() + periodDays * 86400000).toISOString();

    await db.updateSubscription(userId, {
      planId,
      status: 'active',
      provider: 'razorpay',
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      maxDevices: planId === 'annual' ? 3 : 2,
      razorpaySubscriptionId: simulatedSubId,
      razorpayCustomerId: simulatedCustId,
      razorpayPlanId,
      paymentMethodLast4: '4242',
      paymentMethodBrand: 'Visa / UPI Autopay'
    });

    // Record mock payment transaction
    await db.recordPaymentTransaction({
      userId,
      subscriptionId: simulatedSubId,
      provider: 'razorpay',
      providerPaymentId: 'pay_rzp_' + crypto.randomBytes(7).toString('hex'),
      amount: planId === 'annual' ? 470 : 49,
      currency: 'USD',
      status: 'captured',
      method: 'upi_autopay'
    });

    // Log idempotent webhook simulation
    await db.logWebhookEvent(
      'evt_' + simulatedSubId,
      'subscription.activated',
      'processed',
      `Simulated Razorpay subscription activated for user ${email} (${planId} plan)`
    );

    return {
      provider: 'razorpay',
      subscriptionId: simulatedSubId,
      checkoutUrl: `/dashboard?checkout=success&provider=razorpay&plan=${planId}&sub_id=${simulatedSubId}`,
      keyId: this.keyId || 'rzp_test_simulated_key',
      planId,
      amount,
      currency,
      name: 'QBot2 Trading Platform',
      description: `${planId === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
      notes: { userId, planId, email },
      mode: 'simulated_dev'
    };
  }

  /**
   * Verifies Razorpay HMAC SHA256 webhook signature
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!this.webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Accepting webhook in development mode.');
      return true;
    }
    if (!signatureHeader) return false;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      );
    } catch (err) {
      console.error('Razorpay webhook signature verification error:', err);
      return false;
    }
  }

  /**
   * Process Razorpay Webhook Events:
   *  - subscription.activated
   *  - subscription.charged
   *  - subscription.pending
   *  - subscription.halted
   *  - subscription.cancelled
   *  - payment.failed
   *  - refund.created
   */
  async processWebhook(eventPayload: any): Promise<WebhookProcessingResult> {
    const eventType = eventPayload?.event || eventPayload?.type || 'unknown';
    const payloadObj = eventPayload?.payload || {};
    const subscriptionEntity = payloadObj?.subscription?.entity || payloadObj?.entity;
    const paymentEntity = payloadObj?.payment?.entity;
    const refundEntity = payloadObj?.refund?.entity;

    // Use event ID from payload or generate deterministic fallback
    const eventId =
      eventPayload?.id ||
      eventPayload?.event_id ||
      (subscriptionEntity?.id ? `evt_${eventType}_${subscriptionEntity.id}_${Date.now()}` : `evt_${Date.now()}`);

    // Idempotency check
    const alreadyProcessed = await db.isWebhookEventProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`Razorpay webhook ${eventId} already processed. Skipping duplicate.`);
      return {
        status: 'ignored',
        summary: `Duplicate event ${eventId} ignored (idempotency guard)`,
        eventType
      };
    }

    let summary = `Razorpay event ${eventType} logged`;
    let affectedUserId: string | undefined;
    let subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id;

    switch (eventType) {
      // 1. subscription.activated
      case 'subscription.activated': {
        const subId = subscriptionEntity?.id;
        const notes = subscriptionEntity?.notes || {};
        const userId = notes.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          const planId: PlanId = (notes.planId as PlanId) || 'monthly';
          const periodEnd = subscriptionEntity?.current_end
            ? new Date(subscriptionEntity.current_end * 1000).toISOString()
            : new Date(Date.now() + (planId === 'annual' ? 365 : 30) * 86400000).toISOString();

          await db.updateSubscription(userId, {
            status: 'active',
            planId,
            provider: 'razorpay',
            razorpaySubscriptionId: subId,
            razorpayCustomerId: subscriptionEntity?.customer_id,
            razorpayPlanId: subscriptionEntity?.plan_id,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            maxDevices: planId === 'annual' ? 3 : 2
          });

          summary = `Subscription ${subId} activated for user ${userId}`;
          await db.logAudit(userId, 'SUBSCRIPTION_ACTIVATED', `Razorpay subscription ${subId} active`);
        }
        break;
      }

      // 2. subscription.charged (successful recurring billing cycle renewal)
      case 'subscription.charged': {
        const subId = subscriptionEntity?.id;
        const userId = subscriptionEntity?.notes?.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          const currentSub = await db.getSubscription(userId);
          const planId = currentSub?.planId || 'monthly';
          const newPeriodEnd = subscriptionEntity?.current_end
            ? new Date(subscriptionEntity.current_end * 1000).toISOString()
            : new Date(Date.now() + (planId === 'annual' ? 365 : 30) * 86400000).toISOString();

          await db.updateSubscription(userId, {
            status: 'active',
            currentPeriodEnd: newPeriodEnd,
            cancelAtPeriodEnd: false
          });

          // Record payment transaction
          if (paymentEntity) {
            await db.recordPaymentTransaction({
              userId,
              subscriptionId: subId,
              provider: 'razorpay',
              providerPaymentId: paymentEntity.id,
              amount: (paymentEntity.amount || 4900) / 100,
              currency: paymentEntity.currency || 'USD',
              status: 'captured',
              method: paymentEntity.method || 'card'
            });
          }

          summary = `Subscription ${subId} charged successfully. Period extended to ${newPeriodEnd}`;
          await db.logAudit(userId, 'SUBSCRIPTION_CHARGED', `Charged successfully, renewed until ${newPeriodEnd}`);
        }
        break;
      }

      // 3. subscription.pending (awaiting initial authentication or mandate approval)
      case 'subscription.pending': {
        const subId = subscriptionEntity?.id;
        const userId = subscriptionEntity?.notes?.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          await db.updateSubscription(userId, {
            status: 'pending',
            provider: 'razorpay',
            razorpaySubscriptionId: subId
          });
          summary = `Subscription ${subId} state updated to pending for user ${userId}`;
          await db.logAudit(userId, 'SUBSCRIPTION_PENDING', `Awaiting payment mandate authorization`);
        }
        break;
      }

      // 4. subscription.halted (maximum failed charge retries reached, algorithm execution halted)
      case 'subscription.halted': {
        const subId = subscriptionEntity?.id;
        const userId = subscriptionEntity?.notes?.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          await db.updateSubscription(userId, {
            status: 'halted',
            cancelAtPeriodEnd: true
          });
          summary = `Subscription ${subId} halted by Razorpay due to payment exhaustion for user ${userId}`;
          await db.logAudit(userId, 'SUBSCRIPTION_HALTED', `Razorpay halted subscription ${subId}`);
        }
        break;
      }

      // 5. subscription.cancelled
      case 'subscription.cancelled': {
        const subId = subscriptionEntity?.id;
        const userId = subscriptionEntity?.notes?.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          await db.updateSubscription(userId, {
            status: 'canceled',
            cancelAtPeriodEnd: true
          });
          summary = `Subscription ${subId} marked as cancelled for user ${userId}`;
          await db.logAudit(userId, 'SUBSCRIPTION_CANCELLED', `Subscription ${subId} cancelled`);
        }
        break;
      }

      // 6. payment.failed
      case 'payment.failed': {
        const subId = paymentEntity?.subscription_id || subscriptionEntity?.id;
        const userId = paymentEntity?.notes?.userId || (await this.findUserIdBySubId(subId));
        affectedUserId = userId;

        if (userId) {
          await db.updateSubscription(userId, {
            status: 'past_due'
          });

          await db.recordPaymentTransaction({
            userId,
            subscriptionId: subId,
            provider: 'razorpay',
            providerPaymentId: paymentEntity?.id,
            amount: (paymentEntity?.amount || 0) / 100,
            currency: paymentEntity?.currency || 'USD',
            status: 'failed',
            errorCode: paymentEntity?.error_code || 'BAD_REQUEST',
            errorDescription: paymentEntity?.error_description || 'Payment transaction failed'
          });

          summary = `Payment failed for subscription ${subId || 'direct'} (user: ${userId})`;
          await db.logAudit(userId, 'PAYMENT_FAILED', `Payment attempt failed: ${paymentEntity?.error_description || 'Unknown error'}`);
        }
        break;
      }

      // 7. refund.created
      case 'refund.created': {
        const refundId = refundEntity?.id;
        const paymentId = refundEntity?.payment_id;
        const amount = (refundEntity?.amount || 0) / 100;
        const currency = refundEntity?.currency || 'USD';

        // Find user by payment ID or recent transaction
        const allTransactions = await db.getAllPaymentTransactions();
        const tx = allTransactions.find((t) => t.providerPaymentId === paymentId);
        const userId = tx?.userId || 'unknown';
        affectedUserId = userId;

        await db.recordPaymentTransaction({
          userId,
          subscriptionId: tx?.subscriptionId,
          provider: 'razorpay',
          providerPaymentId: paymentId,
          providerOrderId: refundId,
          amount,
          currency,
          status: 'refunded',
          errorDescription: `Refund ${refundId} issued for payment ${paymentId}`
        });

        summary = `Refund ${refundId} created for amount $${amount} on payment ${paymentId}`;
        await db.logAudit(userId, 'REFUND_CREATED', `Refund ${refundId} issued for $${amount}`);
        break;
      }

      default: {
        summary = `Unhandled Razorpay event ${eventType} logged for review`;
      }
    }

    // Persist webhook in database audit trail with idempotency key
    await db.logWebhookEvent(eventId, eventType, 'processed', summary, eventPayload);

    return {
      status: 'processed',
      summary,
      eventType,
      subscriptionId,
      userId: affectedUserId
    };
  }

  async getCustomerPortal(userId: string): Promise<CustomerPortalResult> {
    const sub = await db.getSubscription(userId);
    if (!sub) {
      return {
        url: '/dashboard',
        message: 'No active subscription found.'
      };
    }

    if (this.isLiveConfigured() && sub.razorpaySubscriptionId) {
      return {
        url: `https://dashboard.razorpay.com/app/subscriptions/${sub.razorpaySubscriptionId}`,
        message: 'Direct Razorpay subscription management',
        mode: 'live_razorpay'
      };
    }

    return {
      url: '/dashboard?portal=active',
      message: 'Manage your active subscription directly inside your Algo Trders Customer Dashboard.',
      mode: 'in_app_portal'
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message?: string }> {
    if (this.isLiveConfigured()) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cancel_at_cycle_end: 1 })
        });
        const data = await res.json();
        return { success: !data.error, message: data.error?.description };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }

    return { success: true, message: 'Subscription marked for cancellation at period end.' };
  }

  private async findUserIdBySubId(subId: string | undefined): Promise<string | null> {
    if (!subId) return null;
    const allUsers = await db.getAllUsers();
    for (const u of allUsers) {
      const s = await db.getSubscription(u.id);
      if (s?.razorpaySubscriptionId === subId || s?.id === subId) {
        return u.id;
      }
    }
    return null;
  }
}
