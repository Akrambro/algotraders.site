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

export interface CreateOrderParams {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  userId?: string;
  email?: string;
  planId?: 'monthly' | 'annual';
}

export interface CreateOrderResult {
  order_id: string;
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  key_id?: string;
  status?: string;
  name?: string;
  description?: string;
  notes?: Record<string, string>;
  isSimulated?: boolean;
  authError?: string;
  mode?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId?: string;
  email?: string;
  planId?: 'monthly' | 'annual';
}

export interface VerifyPaymentResult {
  success: boolean;
  message?: string;
  error?: string;
  payment_id?: string;
  order_id?: string;
}

/**
 * Pluggable Payment Provider Interface.
 * Allows effortless swapping between Razorpay, Cashfree, or any other recurring billing gateway.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderType;

  /**
   * Creates a standard Razorpay/gateway order for frontend checkout.
   */
  createOrder?(params: CreateOrderParams): Promise<CreateOrderResult>;

  /**
   * Verifies payment signature returned by frontend modal.
   */
  verifyPayment?(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;

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
