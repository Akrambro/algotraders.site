import bcrypt from 'bcryptjs';
import { getSupabaseClient } from './supabase.ts';
import {
  User,
  Subscription,
  Device,
  WebhookEventLog,
  PaymentTransaction,
  AdminMetrics,
  AuditLog,
  SupportNote,
  SubscriptionStatus,
  PlanId,
  PaymentProviderType
} from '../types.ts';

// ============================================================================
// DATABASE TABLE SCHEMAS (Relational / In-Memory Store Definition)
// ============================================================================

/** Table: users */
export interface UserTable {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'customer' | 'admin';
  is_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

/** Table: subscriptions */
export interface SubscriptionTable {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  provider: PaymentProviderType;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  razorpay_plan_id?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  max_devices: number;
  payment_method_last4?: string;
  payment_method_brand?: string;
  created_at: string;
  updated_at?: string;
}

/** Table: devices */
export interface DeviceTable {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'windows_backend' | 'android_mobile' | 'android_app';
  hardware_fingerprint: string;
  ip_address: string;
  status: 'online' | 'offline' | 'revoked';
  last_heartbeat_at?: string;
  paired_at: string;
}

/** Table: payment_transactions */
export interface PaymentTransactionTable {
  id: string;
  user_id: string;
  subscription_id?: string;
  provider: PaymentProviderType;
  provider_payment_id?: string;
  provider_order_id?: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded' | 'pending';
  method?: string;
  error_code?: string;
  error_description?: string;
  created_at: string;
}

/** Table: webhook_events (Idempotency & Event Auditing) */
export interface WebhookEventTable {
  id: string;
  event_id: string;
  provider: PaymentProviderType;
  event_type: string;
  status: 'processed' | 'failed' | 'ignored';
  summary: string;
  payload?: any;
  processed_at: string;
}

/** Table: audit_logs */
export interface AuditLogTable {
  id: string;
  user_id?: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

/** Table: support_notes */
export interface SupportNoteTable {
  id: string;
  user_id: string;
  author: string;
  content: string;
  created_at: string;
}

/** Table: manual_payments (QR Code Manual Payment & Screenshot Verification) */
export interface ManualPayment {
  id: string;
  orderId: string;
  userId?: string;
  email: string;
  planId: 'monthly' | 'annual';
  amount: number;
  utrNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  createdAt: string;
  verifiedAt?: string;
}

// In-memory Database Store
interface DatabaseStorage {
  users: Map<string, any>;
  subscriptions: Map<string, Subscription>;
  devices: Map<string, Device>;
  paymentTransactions: Map<string, PaymentTransaction>;
  pairingCodes: Map<string, { userId: string; deviceType: string; expiresAt: number }>;
  webhookEvents: Map<string, WebhookEventLog>;
  auditLogs: AuditLog[];
  supportNotes: SupportNote[];
  manualPayments: Map<string, ManualPayment>;
}

const memoryStore: DatabaseStorage = {
  users: new Map(),
  subscriptions: new Map(),
  devices: new Map(),
  paymentTransactions: new Map(),
  pairingCodes: new Map(),
  webhookEvents: new Map(),
  auditLogs: [],
  supportNotes: [],
  manualPayments: new Map()
};

// ============================================================================
// SEED INITIAL DUMMY DATA WITH PROPER TABLE STRUCTURES
// ============================================================================

const defaultPasswordHash = bcrypt.hashSync('password123', 10);
const adminPasswordHash = bcrypt.hashSync('Humhiraja@11', 10);
const now = Date.now();
const oneDayMs = 86400000;

// 1. Seed Users (Production Admin + Authentic Customers)
const seedUsers: (User & { passwordHash: string })[] = [
  {
    id: 'usr_admin_akram',
    email: 'akrambro11@gmail.com',
    name: 'Akram (Super Admin)',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 180 * oneDayMs).toISOString(),
    passwordHash: adminPasswordHash
  },
  {
    id: 'usr_customer_rajesh',
    email: 'rajesh.sharma@mumbaitraders.in',
    name: 'Rajesh Sharma',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 45 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_vikram',
    email: 'vikram.malhotra@bengaluruquants.com',
    name: 'Vikram Malhotra',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: true,
    createdAt: new Date(now - 30 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_ananya',
    email: 'ananya.patel@gujaratfx.in',
    name: 'Ananya Patel',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 25 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_amit',
    email: 'amit.verma@delhialgos.in',
    name: 'Amit Verma',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 60 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_pooja',
    email: 'pooja.sundaram@chennaitrading.com',
    name: 'Pooja Sundaram',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 80 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_rohan',
    email: 'rohan.deshmukh@punefx.in',
    name: 'Rohan Deshmukh',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 14 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_saurabh',
    email: 'saurabh.gupta@jaipurquants.com',
    name: 'Saurabh Gupta',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 40 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_customer_priya',
    email: 'priya.nair@kochiinvest.in',
    name: 'Priya Nair',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 35 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  }
];

seedUsers.forEach(u => memoryStore.users.set(u.id, u));

// 2. Seed Subscriptions (Covering active, pending, halted, canceled, etc.)
const seedSubscriptions: Subscription[] = [
  {
    id: 'sub_rajesh_annual',
    userId: 'usr_customer_rajesh',
    planId: 'annual',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_annual_98214',
    razorpayCustomerId: 'cust_rzp_9921_rajesh',
    razorpayPlanId: 'plan_QBot2Yearly49999',
    currentPeriodStart: new Date(now - 30 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 335 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 3,
    paymentMethodLast4: '4242',
    paymentMethodBrand: 'HDFC / Razorpay UPI Autopay',
    createdAt: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'sub_vikram_monthly',
    userId: 'usr_customer_vikram',
    planId: 'monthly',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_monthly_41290',
    razorpayCustomerId: 'cust_rzp_4129_vikram',
    razorpayPlanId: 'plan_QBot2Monthly4999',
    currentPeriodStart: new Date(now - 12 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 18 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 2,
    paymentMethodLast4: '8811',
    paymentMethodBrand: 'ICICI / Razorpay Autopay',
    createdAt: new Date(now - 12 * oneDayMs).toISOString()
  },
  {
    id: 'sub_ananya_annual',
    userId: 'usr_customer_ananya',
    planId: 'annual',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_ananya_ann_7701',
    razorpayCustomerId: 'cust_rzp_ananya_99',
    razorpayPlanId: 'plan_QBot2Yearly49999',
    currentPeriodStart: new Date(now - 25 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 340 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 3,
    paymentMethodLast4: '5541',
    paymentMethodBrand: 'Axis / UPI Autopay',
    createdAt: new Date(now - 25 * oneDayMs).toISOString()
  },
  {
    id: 'sub_amit_annual',
    userId: 'usr_customer_amit',
    planId: 'annual',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_amit_ann_9901',
    razorpayCustomerId: 'cust_rzp_amit_88',
    razorpayPlanId: 'plan_QBot2Yearly49999',
    currentPeriodStart: new Date(now - 60 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 305 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 3,
    paymentMethodLast4: '3310',
    paymentMethodBrand: 'SBI Netbanking',
    createdAt: new Date(now - 60 * oneDayMs).toISOString()
  },
  {
    id: 'sub_pooja_monthly',
    userId: 'usr_customer_pooja',
    planId: 'monthly',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_pooja_mo_2210',
    razorpayCustomerId: 'cust_rzp_pooja_77',
    razorpayPlanId: 'plan_QBot2Monthly4999',
    currentPeriodStart: new Date(now - 20 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 10 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 2,
    paymentMethodLast4: '9002',
    paymentMethodBrand: 'Kotak Mahindra Card',
    createdAt: new Date(now - 20 * oneDayMs).toISOString()
  },
  {
    id: 'sub_rohan_monthly',
    userId: 'usr_customer_rohan',
    planId: 'monthly',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_rohan_mo_8820',
    razorpayCustomerId: 'cust_rzp_rohan_12',
    razorpayPlanId: 'plan_QBot2Monthly4999',
    currentPeriodStart: new Date(now - 14 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 16 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 2,
    paymentMethodLast4: '1004',
    paymentMethodBrand: 'PhonePe / UPI Autopay',
    createdAt: new Date(now - 14 * oneDayMs).toISOString()
  },
  {
    id: 'sub_saurabh_monthly',
    userId: 'usr_customer_saurabh',
    planId: 'monthly',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_saurabh_mo_5521',
    razorpayCustomerId: 'cust_rzp_saurabh_55',
    razorpayPlanId: 'plan_QBot2Monthly4999',
    currentPeriodStart: new Date(now - 10 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 20 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 2,
    paymentMethodLast4: '7722',
    paymentMethodBrand: 'Google Pay UPI',
    createdAt: new Date(now - 10 * oneDayMs).toISOString()
  },
  {
    id: 'sub_priya_annual',
    userId: 'usr_customer_priya',
    planId: 'annual',
    status: 'active',
    provider: 'razorpay',
    razorpaySubscriptionId: 'sub_rzp_priya_ann_7701',
    razorpayCustomerId: 'cust_rzp_priya_99',
    razorpayPlanId: 'plan_QBot2Yearly49999',
    currentPeriodStart: new Date(now - 35 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 330 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 3,
    paymentMethodLast4: '6619',
    paymentMethodBrand: 'Federal Bank Netbanking',
    createdAt: new Date(now - 35 * oneDayMs).toISOString()
  }
];

seedSubscriptions.forEach(s => memoryStore.subscriptions.set(s.userId, s));

// Seed sample manual payment pending verification
memoryStore.manualPayments.set('mpay_seed_01', {
  id: 'mpay_seed_01',
  orderId: 'ORD1024',
  userId: 'usr_customer_rohan',
  email: 'rohan.deshmukh@punefx.in',
  planId: 'monthly',
  amount: 4999,
  utrNumber: '408912384729',
  status: 'pending',
  notes: 'Paid ₹4,999 via PhonePe to Dheeraj. Note: ORD1024. Verification submitted.',
  createdAt: new Date(now - 2 * 3600000).toISOString()
});

// 3. Seed Paired Devices
const seedDevices: Device[] = [
  {
    id: 'dev_pc_win11_01',
    userId: 'usr_customer_rajesh',
    deviceName: 'Mumbai-Trading-Workstation-Win11',
    deviceType: 'windows_backend',
    hardwareFingerprint: 'BFEBFBFF00090672-SN-99812A4',
    ipAddress: '192.168.1.145:8000',
    status: 'online',
    lastHeartbeatAt: new Date(now - 35000).toISOString(),
    pairedAt: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'dev_android_s24_02',
    userId: 'usr_customer_rajesh',
    deviceName: 'Galaxy S24 Ultra (Android 14)',
    deviceType: 'android_mobile',
    hardwareFingerprint: 'ANDR-98A1-44B2-9901',
    ipAddress: '192.168.1.189',
    status: 'online',
    lastHeartbeatAt: new Date(now - 90000).toISOString(),
    pairedAt: new Date(now - 28 * oneDayMs).toISOString()
  },
  {
    id: 'dev_vikram_thinkpad',
    userId: 'usr_customer_vikram',
    deviceName: 'Bengaluru-ThinkPad-P1',
    deviceType: 'windows_backend',
    hardwareFingerprint: 'INTEL-I9-38910-TP6',
    ipAddress: '10.0.0.42:8000',
    status: 'online',
    lastHeartbeatAt: new Date(now - 60000).toISOString(),
    pairedAt: new Date(now - 12 * oneDayMs).toISOString()
  },
  {
    id: 'dev_priya_laptop',
    userId: 'usr_customer_priya',
    deviceName: 'ThinkPad-X1-Carbon-G11',
    deviceType: 'windows_backend',
    hardwareFingerprint: 'LEN-X1C-9901-PRI',
    ipAddress: '192.168.1.55:8000',
    status: 'online',
    lastHeartbeatAt: new Date(now - 120000).toISOString(),
    pairedAt: new Date(now - 38 * oneDayMs).toISOString()
  },
  {
    id: 'dev_priya_oneplus',
    userId: 'usr_customer_priya',
    deviceName: 'OnePlus 12 (Companion)',
    deviceType: 'android_mobile',
    hardwareFingerprint: 'ANDR-OP12-7712',
    ipAddress: '192.168.1.99',
    status: 'online',
    lastHeartbeatAt: new Date(now - 80000).toISOString(),
    pairedAt: new Date(now - 35 * oneDayMs).toISOString()
  }
];

seedDevices.forEach(d => memoryStore.devices.set(d.id, d));

// 4. Seed Payment Transactions
const seedTransactions: PaymentTransaction[] = [
  {
    id: 'tx_001_alex_annual',
    userId: 'usr_customer_demo',
    subscriptionId: 'sub_rzp_annual_98214',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_annual_init_01',
    providerOrderId: 'order_rzp_ann_01',
    amount: 49999,
    currency: 'INR',
    status: 'captured',
    method: 'upi_autopay',
    createdAt: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'tx_priya_annual_01',
    userId: 'usr_customer_priya',
    subscriptionId: 'sub_rzp_priya_ann_7701',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_priya_captured_99',
    providerOrderId: 'order_rzp_priya_ann',
    amount: 49999,
    currency: 'INR',
    status: 'captured',
    method: 'upi_autopay',
    createdAt: new Date(now - 40 * oneDayMs).toISOString()
  },
  {
    id: 'tx_carlos_pastdue_fail',
    userId: 'usr_customer_carlos',
    subscriptionId: 'sub_carlos_pastdue',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_carlos_fail_01',
    providerOrderId: 'order_rzp_carlos_retry',
    amount: 4999,
    currency: 'INR',
    status: 'failed',
    method: 'card',
    errorCode: 'PAYMENT_EXPIRED_CARD',
    errorDescription: 'Card expiration date passed. Autopay retry pending.',
    createdAt: new Date(now - 2 * oneDayMs).toISOString()
  },
  {
    id: 'tx_002_sarah_month1',
    userId: 'usr_customer_sarah',
    subscriptionId: 'sub_rzp_monthly_41290',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_sarah_01',
    providerOrderId: 'order_rzp_sarah_01',
    amount: 4999,
    currency: 'INR',
    status: 'captured',
    method: 'card',
    createdAt: new Date(now - 12 * oneDayMs).toISOString()
  },
  {
    id: 'tx_003_marcus_fail',
    userId: 'usr_customer_marcus',
    subscriptionId: 'sub_rzp_halted_55210',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_marcus_failed_02',
    providerOrderId: 'order_rzp_marcus_02',
    amount: 4999,
    currency: 'INR',
    status: 'failed',
    method: 'card',
    errorCode: 'BAD_REQUEST_PAYMENT_DECLINED',
    errorDescription: 'Card has insufficient funds or mandate declined by issuing bank',
    createdAt: new Date(now - 5 * oneDayMs).toISOString()
  },
  {
    id: 'tx_004_elena_refund',
    userId: 'usr_customer_elena',
    subscriptionId: 'sub_rzp_canc_33091',
    provider: 'razorpay',
    providerPaymentId: 'pay_rzp_elena_orig',
    providerOrderId: 'rfnd_rzp_elena_01',
    amount: 4999,
    currency: 'INR',
    status: 'refunded',
    method: 'card',
    errorDescription: 'Full satisfaction guarantee refund processed within 30 days',
    createdAt: new Date(now - 30 * oneDayMs).toISOString()
  }
];

seedTransactions.forEach(t => memoryStore.paymentTransactions.set(t.id, t));

// 5. Seed Webhook Events for All 7 Required Event Types:
//   - subscription.activated
//   - subscription.charged
//   - subscription.pending
//   - subscription.halted
//   - subscription.cancelled
//   - payment.failed
//   - refund.created
const seedWebhookEvents: WebhookEventLog[] = [
  {
    id: 'wh_evt_001',
    eventId: 'evt_rzp_act_001',
    eventType: 'subscription.activated',
    status: 'processed',
    processedAt: new Date(now - 30 * oneDayMs).toISOString(),
    summary: 'Processed Razorpay subscription.activated for Alex Vance (₹49,999 Annual Plan)'
  },
  {
    id: 'wh_evt_002',
    eventId: 'evt_rzp_chg_002',
    eventType: 'subscription.charged',
    status: 'processed',
    processedAt: new Date(now - 12 * oneDayMs).toISOString(),
    summary: 'Processed subscription.charged for Sarah Connor (Recurring ₹4,999 captured)'
  },
  {
    id: 'wh_evt_003',
    eventId: 'evt_rzp_pnd_003',
    eventType: 'subscription.pending',
    status: 'processed',
    processedAt: new Date(now - 2 * oneDayMs).toISOString(),
    summary: 'Processed subscription.pending for Rahul Sharma (Awaiting e-mandate OTP verification)'
  },
  {
    id: 'wh_evt_004',
    eventId: 'evt_rzp_hlt_004',
    eventType: 'subscription.halted',
    status: 'processed',
    processedAt: new Date(now - 5 * oneDayMs).toISOString(),
    summary: 'Processed subscription.halted for Marcus Brody (3 retry attempts exhausted, account flagged)'
  },
  {
    id: 'wh_evt_005',
    eventId: 'evt_rzp_can_005',
    eventType: 'subscription.cancelled',
    status: 'processed',
    processedAt: new Date(now - 30 * oneDayMs).toISOString(),
    summary: 'Processed subscription.cancelled for Elena Rostova'
  },
  {
    id: 'wh_evt_006',
    eventId: 'evt_rzp_pay_006',
    eventType: 'payment.failed',
    status: 'processed',
    processedAt: new Date(now - 5 * oneDayMs).toISOString(),
    summary: 'Processed payment.failed for Marcus Brody (₹4,999 card payment declined: insufficient funds)'
  },
  {
    id: 'wh_evt_007',
    eventId: 'evt_rzp_ref_007',
    eventType: 'refund.created',
    status: 'processed',
    processedAt: new Date(now - 30 * oneDayMs).toISOString(),
    summary: 'Processed refund.created for Elena Rostova (₹4,999.00 refunded under money-back guarantee)'
  }
];

seedWebhookEvents.forEach(e => memoryStore.webhookEvents.set(e.eventId, e));

// 6. Support Notes
memoryStore.supportNotes.push(
  {
    id: 'sn_01',
    userId: 'usr_customer_demo',
    author: 'Support Lead',
    content: 'Customer Alex Vance confirmed flawless Wi-Fi pairing between Windows Workstation and Galaxy S24.',
    createdAt: new Date(now - 25 * oneDayMs).toISOString()
  },
  {
    id: 'sn_02',
    userId: 'usr_customer_marcus',
    author: 'Billing Team',
    content: 'Card charge failed 3 times; automated email sent to update card on file.',
    createdAt: new Date(now - 4 * oneDayMs).toISOString()
  }
);

// 7. Initial Audit Trail
memoryStore.auditLogs.push(
  {
    id: 'aud_init_01',
    userId: 'usr_customer_demo',
    action: 'SUBSCRIPTION_ACTIVATED',
    details: 'Annual Pro plan active with 3 authorized device slots',
    timestamp: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'aud_init_02',
    userId: 'usr_customer_marcus',
    action: 'SUBSCRIPTION_HALTED',
    details: 'Recurring payment retry limit reached; algorithm execution suspended',
    timestamp: new Date(now - 5 * oneDayMs).toISOString()
  }
);

// ============================================================================
// DATABASE REPOSITORY IMPLEMENTATION
// ============================================================================

export const db = {
  // --- USERS ---
  async findUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return u;
      }
    }
    return null;
  },

  async findUserById(id: string) {
    return memoryStore.users.get(id) || null;
  },

  async createUser(data: { email: string; passwordHash: string; name?: string; role?: 'customer' | 'admin' }) {
    const id = 'usr_' + Math.random().toString(36).substring(2, 10);
    const user = {
      id,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      name: data.name || data.email.split('@')[0],
      role: data.role || 'customer',
      isVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };
    memoryStore.users.set(id, user);

    // Default subscription in inactive state until customer purchases Monthly or Annual license
    const newSub: Subscription = {
      id: 'sub_' + Math.random().toString(36).substring(2, 10),
      userId: id,
      planId: 'monthly',
      status: 'inactive',
      provider: 'razorpay',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: false,
      maxDevices: 2,
      createdAt: new Date().toISOString()
    };
    memoryStore.subscriptions.set(id, newSub);

    await this.logAudit(id, 'USER_REGISTERED', `User registered (account created)`);
    return user;
  },

  async updateUser(id: string, updates: Partial<any>) {
    const user = memoryStore.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    memoryStore.users.set(id, updated);
    return updated;
  },

  async deleteUser(id: string) {
    memoryStore.users.delete(id);
    memoryStore.subscriptions.delete(id);
    for (const [devId, dev] of memoryStore.devices.entries()) {
      if (dev.userId === id) {
        memoryStore.devices.delete(devId);
      }
    }
    return true;
  },

  async getAllUsers() {
    return Array.from(memoryStore.users.values()).map(u => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
  },

  // --- SUBSCRIPTIONS ---
  async getSubscription(userId: string): Promise<Subscription | null> {
    return memoryStore.subscriptions.get(userId) || null;
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(memoryStore.subscriptions.values());
  },

  /**
   * Finds subscription by subscription ID, Razorpay subscription ID, or user ID
   */
  async findSubscriptionById(id: string): Promise<Subscription | null> {
    // 1. Direct match by user ID
    if (memoryStore.subscriptions.has(id)) {
      return memoryStore.subscriptions.get(id)!;
    }

    // 2. Match by internal subscription ID or razorpaySubscriptionId
    for (const sub of memoryStore.subscriptions.values()) {
      if (sub.id === id || sub.razorpaySubscriptionId === id || sub.userId === id) {
        return sub;
      }
    }
    return null;
  },

  async updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const current = memoryStore.subscriptions.get(userId);
    if (!current) {
      const newSub: Subscription = {
        id: 'sub_' + Math.random().toString(36).substring(2, 10),
        userId,
        planId: updates.planId || 'monthly',
        status: updates.status || 'active',
        provider: updates.provider || 'razorpay',
        currentPeriodStart: updates.currentPeriodStart || new Date().toISOString(),
        currentPeriodEnd: updates.currentPeriodEnd || new Date(Date.now() + 30 * oneDayMs).toISOString(),
        cancelAtPeriodEnd: updates.cancelAtPeriodEnd ?? false,
        maxDevices: updates.maxDevices || 2,
        createdAt: new Date().toISOString(),
        ...updates
      };
      memoryStore.subscriptions.set(userId, newSub);
      return newSub;
    }
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    memoryStore.subscriptions.set(userId, updated);
    return updated;
  },

  /**
   * Admin Subscription Activation (POST /api/admin/subscriptions/{id}/activate)
   */
  async activateSubscription(id: string): Promise<Subscription | null> {
    const sub = await this.findSubscriptionById(id);
    if (!sub) return null;

    const now = Date.now();
    const isPast = !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() <= now;
    const durationDays = sub.planId === 'annual' ? 365 : 30;
    const currentPeriodEnd = isPast
      ? new Date(now + durationDays * oneDayMs).toISOString()
      : sub.currentPeriodEnd;

    const updated = await this.updateSubscription(sub.userId, {
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd
    });

    await this.logAudit(sub.userId, 'ADMIN_SUBSCRIPTION_ACTIVATED', `Subscription ${sub.id} activated by admin`);
    return updated;
  },

  /**
   * Admin Subscription Suspension (POST /api/admin/subscriptions/{id}/suspend)
   */
  async suspendSubscription(id: string): Promise<Subscription | null> {
    const sub = await this.findSubscriptionById(id);
    if (!sub) return null;

    const updated = await this.updateSubscription(sub.userId, {
      status: 'suspended'
    });

    await this.logAudit(sub.userId, 'ADMIN_SUBSCRIPTION_SUSPENDED', `Subscription ${sub.id} suspended by admin`);
    return updated;
  },

  // --- MANUAL QR PAYMENTS & VERIFICATION ---
  async submitManualPayment(data: {
    orderId?: string;
    userId?: string;
    email: string;
    planId: 'monthly' | 'annual';
    amount: number;
    utrNumber: string;
    notes?: string;
  }): Promise<ManualPayment> {
    const id = 'mpay_' + Math.random().toString(36).substring(2, 10);
    const cleanEmail = data.email.toLowerCase().trim();
    const orderId = data.orderId?.trim() || ('ORD' + Math.floor(1000 + Math.random() * 9000));
    const record: ManualPayment = {
      id,
      orderId,
      userId: data.userId,
      email: cleanEmail,
      planId: data.planId,
      amount: data.amount,
      utrNumber: data.utrNumber.trim(),
      status: 'pending',
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    memoryStore.manualPayments.set(id, record);

    // If an existing user matches, link and update subscription to pending
    let user = data.userId ? await this.findUserById(data.userId) : await this.findUserByEmail(cleanEmail);
    if (user) {
      record.userId = user.id;
      const sub = await this.getSubscription(user.id);
      if (sub && sub.status !== 'active') {
        await this.updateSubscription(user.id, {
          planId: data.planId,
          status: 'pending'
        });
      }
    }

    await this.logAudit(record.userId, 'MANUAL_PAYMENT_SUBMITTED', `User ${record.email} submitted payment UTR: ${record.utrNumber} for ${record.planId} (₹${record.amount})`);
    return record;
  },

  async getAllManualPayments(): Promise<ManualPayment[]> {
    return Array.from(memoryStore.manualPayments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async verifyManualPayment(paymentId: string): Promise<{ success: boolean; payment?: ManualPayment; user?: any; error?: string }> {
    const payment = memoryStore.manualPayments.get(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment verification record not found.' };
    }

    payment.status = 'verified';
    payment.verifiedAt = new Date().toISOString();
    memoryStore.manualPayments.set(paymentId, payment);

    // Find or create the user in the database
    let user = payment.userId ? await this.findUserById(payment.userId) : await this.findUserByEmail(payment.email);
    if (!user) {
      user = await this.createUser({
        email: payment.email,
        passwordHash: defaultPasswordHash,
        name: payment.email.split('@')[0],
        role: 'customer'
      });
      payment.userId = user.id;
    }

    // Activate subscription and unlock software downloads
    const durationDays = payment.planId === 'annual' ? 365 : 30;
    const maxDevices = payment.planId === 'annual' ? 3 : 2;

    await this.updateSubscription(user.id, {
      planId: payment.planId,
      status: 'active',
      cancelAtPeriodEnd: false,
      maxDevices,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + durationDays * oneDayMs).toISOString()
    });

    // Record verified transaction in database
    const txId = 'tx_qr_' + Math.random().toString(36).substring(2, 10);
    memoryStore.paymentTransactions.set(txId, {
      id: txId,
      userId: user.id,
      subscriptionId: 'sub_' + user.id,
      provider: 'razorpay',
      amount: payment.amount * 100,
      currency: 'INR',
      status: 'captured',
      method: 'UPI_QR_MANUAL',
      createdAt: new Date().toISOString()
    });

    await this.logAudit(user.id, 'PAYMENT_VERIFIED_BY_ADMIN', `Manual payment ${payment.utrNumber} verified. User added to paying database and software downloads unlocked.`);

    return { success: true, payment, user };
  },

  // --- PAYMENT TRANSACTIONS ---
  async recordPaymentTransaction(txData: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<PaymentTransaction> {
    const id = 'tx_' + Math.random().toString(36).substring(2, 10);
    const tx: PaymentTransaction = {
      ...txData,
      id,
      createdAt: new Date().toISOString()
    };
    memoryStore.paymentTransactions.set(id, tx);
    return tx;
  },

  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return Array.from(memoryStore.paymentTransactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getPaymentTransactionsByUser(userId: string): Promise<PaymentTransaction[]> {
    const all = await this.getAllPaymentTransactions();
    return all.filter(t => t.userId === userId);
  },

  // --- DEVICES ---
  async getDevicesByUser(userId: string): Promise<Device[]> {
    const result: Device[] = [];
    for (const d of memoryStore.devices.values()) {
      if (d.userId === userId && d.status !== 'revoked') {
        result.push(d);
      }
    }
    return result;
  },

  async getAllActiveDevices(): Promise<Device[]> {
    return Array.from(memoryStore.devices.values());
  },

  async createPairingCode(userId: string, deviceType: string = 'windows_backend'): Promise<{ code: string; expiresAt: string; remainingSeconds: number }> {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `QB-${randomDigits}`;
    const expiresAt = Date.now() + 10 * 60 * 1000;

    memoryStore.pairingCodes.set(code, {
      userId,
      deviceType,
      expiresAt
    });

    return {
      code,
      expiresAt: new Date(expiresAt).toISOString(),
      remainingSeconds: 600
    };
  },

  async verifyAndConsumePairingCode(code: string, deviceName: string, hardwareFingerprint?: string, ipAddress?: string): Promise<Device | null> {
    const session = memoryStore.pairingCodes.get(code.toUpperCase().trim());
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      memoryStore.pairingCodes.delete(code.toUpperCase().trim());
      return null;
    }

    const sub = await this.getSubscription(session.userId);
    const maxDevices = sub?.maxDevices || 2;
    const existingDevices = await this.getDevicesByUser(session.userId);

    if (existingDevices.length >= maxDevices) {
      throw new Error(`Device limit reached for plan (${existingDevices.length}/${maxDevices}). Revoke an existing device to pair.`);
    }

    const newDevice: Device = {
      id: 'dev_' + Math.random().toString(36).substring(2, 10),
      userId: session.userId,
      deviceName: deviceName || (session.deviceType === 'windows_backend' ? 'Windows PC' : 'Android Phone'),
      deviceType: (session.deviceType as any) || 'windows_backend',
      hardwareFingerprint: hardwareFingerprint || 'HWFP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ipAddress: ipAddress || '192.168.1.' + Math.floor(10 + Math.random() * 200),
      status: 'online',
      lastHeartbeatAt: new Date().toISOString(),
      pairedAt: new Date().toISOString()
    };

    memoryStore.devices.set(newDevice.id, newDevice);
    memoryStore.pairingCodes.delete(code.toUpperCase().trim());

    await this.logAudit(session.userId, 'DEVICE_PAIRED', `Paired ${newDevice.deviceName} (${newDevice.deviceType})`);
    return newDevice;
  },

  async revokeDevice(deviceId: string, userId?: string) {
    const device = memoryStore.devices.get(deviceId);
    if (!device) return false;
    if (userId && device.userId !== userId) return false;

    device.status = 'revoked';
    memoryStore.devices.set(deviceId, device);
    await this.logAudit(device.userId, 'DEVICE_REVOKED', `Revoked device ${device.deviceName}`);
    return true;
  },

  async updateDeviceHeartbeat(deviceId: string, ipAddress?: string) {
    const device = memoryStore.devices.get(deviceId);
    if (!device || device.status === 'revoked') return null;
    device.lastHeartbeatAt = new Date().toISOString();
    device.status = 'online';
    if (ipAddress) device.ipAddress = ipAddress;
    return device;
  },

  // --- WEBHOOK IDEMPOTENCY ---
  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    return memoryStore.webhookEvents.has(eventId);
  },

  async logWebhookEvent(eventId: string, eventType: string, status: 'processed' | 'failed' | 'ignored', summary: string, payload?: any) {
    const log: WebhookEventLog = {
      id: 'wh_' + Math.random().toString(36).substring(2, 10),
      eventId,
      eventType,
      status,
      summary,
      processedAt: new Date().toISOString(),
      payload
    };
    memoryStore.webhookEvents.set(eventId, log);
    return log;
  },

  async getRecentWebhookEvents(limit: number = 30): Promise<WebhookEventLog[]> {
    return Array.from(memoryStore.webhookEvents.values())
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
      .slice(0, limit);
  },

  // --- AUDIT LOGGING ---
  async logAudit(userId: string | undefined, action: string, details: string, ipAddress?: string) {
    const log: AuditLog = {
      id: 'aud_' + Math.random().toString(36).substring(2, 10),
      userId,
      action,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    };
    memoryStore.auditLogs.unshift(log);
    if (memoryStore.auditLogs.length > 500) {
      memoryStore.auditLogs.pop();
    }
    return log;
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return memoryStore.auditLogs.slice(0, limit);
  },

  // --- SUPPORT NOTES ---
  async getSupportNotes(userId: string): Promise<SupportNote[]> {
    return memoryStore.supportNotes.filter(n => n.userId === userId);
  },

  async addSupportNote(userId: string, author: string, content: string) {
    const note: SupportNote = {
      id: 'sn_' + Math.random().toString(36).substring(2, 10),
      userId,
      author,
      content,
      createdAt: new Date().toISOString()
    };
    memoryStore.supportNotes.push(note);
    return note;
  },

  // --- ADMIN METRICS ---
  async getAdminMetrics(): Promise<AdminMetrics> {
    let totalCustomers = 0;
    let activeSubscriptions = 0;
    let trialUsers = 0;
    let expiredSubscriptions = 0;
    let failedPayments = 0;
    let mrr = 0;

    for (const u of memoryStore.users.values()) {
      if (u.role === 'customer') {
        totalCustomers++;
      }
    }

    for (const s of memoryStore.subscriptions.values()) {
      if (s.status === 'active') {
        activeSubscriptions++;
        if (s.planId === 'monthly') mrr += 4999;
        if (s.planId === 'annual') mrr += Math.round(49999 / 12);
      } else if (s.status === 'trialing' || s.status === 'pending') {
        trialUsers++;
      } else if (s.status === 'expired' || s.status === 'canceled') {
        expiredSubscriptions++;
      } else if (s.status === 'past_due' || s.status === 'unpaid' || s.status === 'halted') {
        failedPayments++;
      }
    }

    let activeDevicesCount = 0;
    for (const d of memoryStore.devices.values()) {
      if (d.status === 'online') activeDevicesCount++;
    }

    return {
      totalCustomers,
      activeSubscriptions,
      trialUsers,
      expiredSubscriptions,
      failedPayments,
      mrr,
      activeDevicesCount
    };
  },

  // --- RAW DATABASE TABLES FOR DATABASE EXPLORER ---
  async getAllDatabaseTables() {
    const users = Array.from(memoryStore.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isVerified: u.isVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt
    }));
    const subscriptions = Array.from(memoryStore.subscriptions.values());
    const devices = Array.from(memoryStore.devices.values());
    const transactions = Array.from(memoryStore.paymentTransactions.values());
    const webhooks = Array.from(memoryStore.webhookEvents.values());
    const auditLogs = memoryStore.auditLogs.slice(0, 50);

    return {
      status: {
        mode: 'PostgreSQL-Compatible Resilient In-Memory Schema',
        connected: true,
        totalUsers: users.length,
        totalSubscriptions: subscriptions.length,
        totalDevices: devices.length,
        totalTransactions: transactions.length,
        totalWebhooks: webhooks.length
      },
      tables: {
        users,
        subscriptions,
        devices,
        transactions,
        webhooks,
        auditLogs
      }
    };
  }
};
