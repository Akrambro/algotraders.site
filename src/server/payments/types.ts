import { PlanId, SubscriptionStatus, PaymentProviderType } from '../../types.ts';

export interface CreateCheckoutParams {
  userId: string;
  email: string;
  name?: string;
  planId: 'monthly' | 'annual';
}

export interface CheckoutSessionResult {
  provider: PaymentProviderType;
  subscriptionId: string;
  checkoutUrl: string;
  keyId?: string;
  planId: PlanId;
  amount: number;
  currency: string;
  name: string;
  description: string;
  notes: Record<string, string>;
  mode: 'live' | 'simulated_dev';
}

export interface WebhookProcessingResult {
  status: 'processed' | 'ignored' | 'failed';
  summary: string;
  eventType: string;
  subscriptionId?: string;
  userId?: string;
  data?: any;
}

export interface CustomerPortalResult {
  url: string;
  message?: string;
  mode?: string;
}

/**
 * Pluggable Payment Provider Interface.
 * Allows effortless swapping between Razorpay, Cashfree, Stripe, or any other recurring billing gateway.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderType;

  /**
   * Creates a recurring subscription or checkout session for a customer.
   */
  createSubscription(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * Verifies the cryptographic HMAC webhook signature.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;

  /**
   * Parses and applies subscription lifecycle events to the database.
   * Required events:
   *  - subscription.activated
   *  - subscription.charged
   *  - subscription.pending
   *  - subscription.halted
   *  - subscription.cancelled
   *  - payment.failed
   *  - refund.created
   */
  processWebhook(eventPayload: any): Promise<WebhookProcessingResult>;

  /**
   * Generates a link or payload for customer self-service billing management.
   */
  getCustomerPortal(userId: string): Promise<CustomerPortalResult>;

  /**
   * Cancels an active recurring subscription with the payment gateway.
   */
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message?: string }>;
}
