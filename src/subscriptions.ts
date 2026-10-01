import type {Subscription, SubscriptionStatus} from './types.ts';

// A stored "active" flag alone never grants a paid entitlement.
export function getSubscriptionStatus(subscription: Subscription | null | undefined, now = Date.now()): SubscriptionStatus | 'none' {
  if (!subscription) return 'none';
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return subscription.status;
  const start = Date.parse(subscription.currentPeriodStart);
  const end = Date.parse(subscription.currentPeriodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'inactive';
  if (end <= now) return 'expired';
  if (start > now) return 'pending';
  return subscription.status;
}

export function hasActiveSubscription(subscription: Subscription | null | undefined, now = Date.now()): boolean {
  return getSubscriptionStatus(subscription, now) === 'active';
}
