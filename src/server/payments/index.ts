import { PaymentProvider } from './types.ts';
import { RazorpayProvider } from './razorpay.ts';
import { CashfreeProvider } from './cashfree.ts';

const razorpayProviderInstance = new RazorpayProvider();
const cashfreeProviderInstance = new CashfreeProvider();

/**
 * Payment Provider Factory.
 * Defaults to Razorpay as the initial payment provider.
 * Allows effortless swapping to Cashfree or others based on PAYMENT_PROVIDER environment variable.
 */
export function getPaymentProvider(providerName?: string): PaymentProvider {
  const chosen = (providerName || process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase();
  if (chosen === 'cashfree') {
    return cashfreeProviderInstance;
  }
  return razorpayProviderInstance;
}

export const paymentProvider = getPaymentProvider();
export * from './types.ts';
export { RazorpayProvider } from './razorpay.ts';
export { CashfreeProvider } from './cashfree.ts';
