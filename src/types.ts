export type UserRole = 'customer' | 'admin';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'inactive'
  | 'pending'
  | 'halted'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'expired'
  | 'suspended';

export type PlanId = 'trial' | 'monthly' | 'annual';

export type PaymentProviderType = 'razorpay' | 'cashfree';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  provider: PaymentProviderType;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  maxDevices: number;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  razorpayPlanId?: string;
  paymentMethodLast4?: string;
  paymentMethodBrand?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  subscriptionId?: string;
  provider: PaymentProviderType;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded' | 'pending';
  method?: string;
  errorCode?: string;
  errorDescription?: string;
  createdAt: string;
}

export type DeviceType = 'windows_backend' | 'android_mobile' | 'android_app';
export type DeviceStatus = 'online' | 'offline' | 'revoked';

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: DeviceType;
  hardwareFingerprint?: string;
  ipAddress?: string;
  status: DeviceStatus;
  lastHeartbeatAt?: string;
  pairedAt: string;
}

export interface PairingSession {
  code: string;
  expiresAt: string;
  remainingSeconds: number;
}

export interface DownloadItem {
  id: string;
  title: string;
  version: string;
  platform: 'windows' | 'android' | 'documentation';
  filename: string;
  size: string;
  releaseDate: string;
  downloadUrl: string;
  sha256: string;
  changelog: string[];
}

export interface WebhookEventLog {
  id: string;
  eventId: string;
  eventType: string;
  status: 'processed' | 'failed' | 'ignored';
  processedAt: string;
  summary: string;
  payload?: any;
}

export interface AdminMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  trialUsers: number;
  expiredSubscriptions: number;
  failedPayments: number;
  mrr: number;
  activeDevicesCount: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SupportNote {
  id: string;
  userId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface LicenseValidationResponse {
  valid: boolean;
  entitlementId: string;
  status: SubscriptionStatus;
  planId: PlanId;
  maxDevices: number;
  expiresAt: string;
  offlineGracePeriodHours: number;
  tradingAllowed: boolean;
  message?: string;
  signature?: string;
}
