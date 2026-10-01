import type {LicenseRecord, Subscription} from './types.ts';
import {hasActiveSubscription} from './subscriptions.ts';

export function getLicenseStatus(license: LicenseRecord, subscription?: Subscription | null, now = Date.now()): string {
  if (license.status === 'revoked' || license.device?.status === 'revoked') return 'revoked';
  const expiry = Date.parse(license.expires_at);
  if (!Number.isFinite(expiry) || expiry <= now) return 'expired';
  if (subscription !== undefined && !hasActiveSubscription(subscription, now)) return 'subscription inactive';
  return license.status === 'issued' ? 'ready to activate' : 'active';
}
