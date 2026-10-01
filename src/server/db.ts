import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from './supabase.ts';
import type { User, Subscription, Device, PaymentTransaction, AdminMetrics, AuditLog, SupportNote } from '../types.ts';
import { getSubscriptionStatus, hasActiveSubscription } from '../subscriptions.ts';

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}

export function database() {
  return getSupabaseClient();
}

const isSchemaError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === 'PGRST204' ||
    code === 'PGRST301' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the function')
  );
};

export async function result<T = any>(query: PromiseLike<{ data: T; error: null } | { data: null; error: { message: string; code?: string } }>): Promise<T> {
  const { data, error } = await query;
  if (error) {
    if (isSchemaError(error)) {
      throw new DatabaseError(error.message || 'Table not in schema cache', 'SCHEMA_MISSING');
    }
    throw new DatabaseError(error.message || 'Database operation failed', error.code);
  }
  return data as T;
}

const camel = (row: any): any => row && Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase()), value]));
const snake = (row: any) => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined).map(([key, value]) => [key.replace(/[A-Z]/g, ch => '_' + ch.toLowerCase()), value]));
const safeUser = (row: any) => { const { passwordHash, ...user } = camel(row); return user; };
const audit = (row: any) => ({ ...camel(row), timestamp: row.created_at || row.timestamp });

// ==========================================
// IN-MEMORY STORAGE WITH SEEDED ACCOUNTS
// ==========================================

const adminPasswordHash = bcrypt.hashSync('Humhiraja@11', 10);
const defaultPasswordHash = bcrypt.hashSync('password123', 10);
const now = Date.now();
const oneDayMs = 86400000;

interface MemoryStorage {
  users: Map<string, User & { passwordHash?: string }>;
  subscriptions: Map<string, Subscription>;
  devices: Map<string, Device>;
  manualPayments: Map<string, any>;
  transactions: Map<string, PaymentTransaction>;
  licenses: Map<string, any>;
  challenges: Map<string, any>;
  auditLogs: AuditLog[];
  supportNotes: SupportNote[];
  webhookEvents: Map<string, any>;
}

const memory: MemoryStorage = {
  users: new Map(),
  subscriptions: new Map(),
  devices: new Map(),
  manualPayments: new Map(),
  transactions: new Map(),
  licenses: new Map(),
  challenges: new Map(),
  auditLogs: [],
  supportNotes: [],
  webhookEvents: new Map()
};

// Seed Production Admin & Sample Customers
const seedUsers: (User & { passwordHash: string })[] = [
  {
    id: 'usr_admin_akram',
    email: 'akrambro11@gmail.com',
    name: 'Akram (Admin)',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 90 * oneDayMs).toISOString(),
    passwordHash: adminPasswordHash
  },
  {
    id: 'usr_cust_rajesh',
    email: 'rajesh.sharma@mumbaitraders.in',
    name: 'Rajesh Sharma',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 45 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_cust_vikram',
    email: 'vikram.malhotra@bengaluruquants.com',
    name: 'Vikram Malhotra',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 30 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  },
  {
    id: 'usr_cust_ananya',
    email: 'ananya.patel@gujaratfx.in',
    name: 'Ananya Patel',
    role: 'customer',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(now - 25 * oneDayMs).toISOString(),
    passwordHash: defaultPasswordHash
  }
];

seedUsers.forEach(u => memory.users.set(u.id, u));

// Seed Subscriptions
const seedSubscriptions: Subscription[] = [
  {
    id: 'sub_admin_akram',
    userId: 'usr_admin_akram',
    planId: 'annual',
    status: 'active',
    provider: 'manual',
    currentPeriodStart: new Date(now - 90 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 275 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 1,
    createdAt: new Date(now - 90 * oneDayMs).toISOString()
  },
  {
    id: 'sub_cust_rajesh',
    userId: 'usr_cust_rajesh',
    planId: 'annual',
    status: 'active',
    provider: 'manual',
    currentPeriodStart: new Date(now - 30 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 335 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 1,
    createdAt: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'sub_cust_vikram',
    userId: 'usr_cust_vikram',
    planId: 'monthly',
    status: 'active',
    provider: 'manual',
    currentPeriodStart: new Date(now - 12 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 18 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 1,
    createdAt: new Date(now - 12 * oneDayMs).toISOString()
  },
  {
    id: 'sub_cust_ananya',
    userId: 'usr_cust_ananya',
    planId: 'monthly',
    status: 'active',
    provider: 'manual',
    currentPeriodStart: new Date(now - 25 * oneDayMs).toISOString(),
    currentPeriodEnd: new Date(now + 5 * oneDayMs).toISOString(),
    cancelAtPeriodEnd: false,
    maxDevices: 1,
    createdAt: new Date(now - 25 * oneDayMs).toISOString()
  }
];

seedSubscriptions.forEach(s => memory.subscriptions.set(s.userId, s));

// Seed Sample Devices
const seedDevices: Device[] = [
  {
    id: 'dev_pc_win11_01',
    userId: 'usr_cust_rajesh',
    deviceName: 'Mumbai-Trading-Workstation-Win11',
    deviceType: 'windows_backend',
    hardwareFingerprint: 'BFEBFBFF00090672-SN-99812A4',
    ipAddress: '192.168.1.145:8000',
    status: 'online',
    lastHeartbeatAt: new Date(now - 35000).toISOString(),
    pairedAt: new Date(now - 30 * oneDayMs).toISOString()
  },
  {
    id: 'dev_vikram_thinkpad',
    userId: 'usr_cust_vikram',
    deviceName: 'Bengaluru-ThinkPad-P1',
    deviceType: 'windows_backend',
    hardwareFingerprint: 'INTEL-I9-38910-TP6',
    ipAddress: '10.0.0.42:8000',
    status: 'online',
    lastHeartbeatAt: new Date(now - 60000).toISOString(),
    pairedAt: new Date(now - 12 * oneDayMs).toISOString()
  }
];

seedDevices.forEach(d => memory.devices.set(d.id, d));

// Seed Initial Audit Logs
memory.auditLogs.push(
  {
    id: 'aud_init_01',
    userId: 'usr_admin_akram',
    action: 'SYSTEM_INITIALIZED',
    details: 'Algo Trders QBot2 unified database ready. Admin portal protected.',
    timestamp: new Date().toISOString()
  }
);

// ==========================================
// DB REPOSITORY WITH AUTOMATIC FALLBACK
// ==========================================

export const db = {
  async findUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    const cleanEmail = email.trim().toLowerCase();
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('users').select('*').ilike('email', cleanEmail).maybeSingle());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase findUserByEmail fallback:', err.message);
      }
    }
    for (const u of memory.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return u;
      }
    }
    return null;
  },

  async findUserById(id: string): Promise<(User & { passwordHash?: string }) | null> {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('users').select('*').eq('id', id).maybeSingle());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase findUserById fallback:', err.message);
      }
    }
    return memory.users.get(id) || null;
  },

  async createUser(data: { email: string; passwordHash: string; name?: string; role?: 'customer' | 'admin' }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name?.trim() || cleanEmail.split('@')[0];
    const userRole = data.role || (cleanEmail === 'akrambro11@gmail.com' ? 'admin' : 'customer');
    const client = database();

    if (client) {
      try {
        // Try stored procedure first
        try {
          const res = await result(client.rpc('register_user', {
            p_email: cleanEmail,
            p_password_hash: data.passwordHash,
            p_name: cleanName
          }));
          if (res?.user) {
            const u = safeUser(res.user);
            memory.users.set(u.id, { ...u, passwordHash: data.passwordHash });
            if (res.subscription) memory.subscriptions.set(u.id, camel(res.subscription));
            return u;
          }
        } catch {
          // Direct table insert fallback
          const userRow = await result(client.from('users').insert({
            email: cleanEmail,
            password_hash: data.passwordHash,
            name: cleanName,
            role: userRole,
            is_verified: true,
            two_factor_enabled: false
          }).select().single());

          if (userRow) {
            const u = safeUser(userRow);
            memory.users.set(u.id, { ...u, passwordHash: data.passwordHash });
            
            // Create subscription record
            const subRow = await result(client.from('subscriptions').insert({
              user_id: u.id,
              plan_id: 'monthly',
              status: 'active',
              provider: 'manual',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * oneDayMs).toISOString(),
              cancel_at_period_end: false,
              max_devices: 1
            }).select().single());
            if (subRow) memory.subscriptions.set(u.id, camel(subRow));

            return u;
          }
        }
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase createUser fallback:', err.message);
      }
    }

    const id = 'usr_' + crypto.randomBytes(6).toString('hex');
    const user: User & { passwordHash: string } = {
      id,
      email: cleanEmail,
      name: cleanName,
      role: userRole,
      isVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      passwordHash: data.passwordHash
    };
    memory.users.set(id, user);

    const subscription: Subscription = {
      id: 'sub_' + id,
      userId: id,
      planId: 'monthly',
      status: 'active',
      provider: 'manual',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * oneDayMs).toISOString(),
      cancelAtPeriodEnd: false,
      maxDevices: 1,
      createdAt: new Date().toISOString()
    };
    memory.subscriptions.set(id, subscription);

    return safeUser(user);
  },

  async updateUser(id: string, updates: any) {
    const client = database();
    const allowed = Object.fromEntries(
      ['name', 'passwordHash', 'isVerified', 'twoFactorEnabled']
        .filter(key => updates[key] !== undefined)
        .map(key => [key, updates[key]])
    );
    if (client) {
      try {
        const row = await result(client.from('users').update({ ...snake(allowed), updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle());
        if (row) {
          const u = camel(row);
          const curr = memory.users.get(id);
          if (curr) memory.users.set(id, { ...curr, ...u });
          return u;
        }
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase updateUser fallback:', err.message);
      }
    }
    const current = memory.users.get(id);
    if (current) {
      const updated = { ...current, ...allowed };
      memory.users.set(id, updated);
      return safeUser(updated);
    }
    return null;
  },

  async deleteUser(id: string) {
    const client = database();
    if (client) {
      try {
        await result(client.from('users').delete().eq('id', id));
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase deleteUser fallback:', err.message);
      }
    }
    memory.users.delete(id);
    memory.subscriptions.delete(id);
    for (const [devId, dev] of memory.devices.entries()) {
      if (dev.userId === id) memory.devices.delete(devId);
    }
    return true;
  },

  async getAllUsers(): Promise<User[]> {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('users').select('*').order('created_at', { ascending: false }));
        if (rows && rows.length > 0) return rows.map(safeUser);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAllUsers fallback:', err.message);
      }
    }
    return Array.from(memory.users.values()).map(safeUser);
  },

  async getSubscription(userId: string): Promise<Subscription | null> {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('subscriptions').select('*').eq('user_id', userId).maybeSingle());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getSubscription fallback:', err.message);
      }
    }
    return memory.subscriptions.get(userId) || null;
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('subscriptions').select('*'));
        if (rows && rows.length > 0) return rows.map(camel);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAllSubscriptions fallback:', err.message);
      }
    }
    return Array.from(memory.subscriptions.values());
  },

  async findSubscriptionById(id: string): Promise<Subscription | null> {
    const client = database();
    if (client) {
      try {
        const found = await result(client.from('subscriptions').select('*').eq('id', id).maybeSingle());
        if (found) return camel(found);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase findSubscriptionById fallback:', err.message);
      }
    }
    for (const sub of memory.subscriptions.values()) {
      if (sub.id === id || sub.userId === id) return sub;
    }
    return null;
  },

  async updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const client = database();
    const allowed = Object.fromEntries(
      ['planId', 'status', 'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'maxDevices']
        .filter(key => (updates as any)[key] !== undefined)
        .map(key => [key, (updates as any)[key]])
    );
    if (client) {
      try {
        const row = await result(client.from('subscriptions').update({ ...snake(allowed), updated_at: new Date().toISOString() }).eq('user_id', userId).select().single());
        if (row) {
          const sub = camel(row);
          memory.subscriptions.set(userId, sub);
          return sub;
        }
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase updateSubscription fallback:', err.message);
      }
    }
    const current = memory.subscriptions.get(userId) || {
      id: 'sub_' + userId,
      userId,
      planId: 'monthly',
      status: 'active',
      provider: 'manual',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * oneDayMs).toISOString(),
      cancelAtPeriodEnd: false,
      maxDevices: 1,
      createdAt: new Date().toISOString()
    };
    const updated = { ...current, ...allowed, updatedAt: new Date().toISOString() };
    memory.subscriptions.set(userId, updated);
    return updated;
  },

  async activateSubscription(id: string) {
    const sub = await this.findSubscriptionById(id);
    if (!sub) return null;
    return this.updateSubscription(sub.userId, { status: 'active' });
  },

  async suspendSubscription(id: string) {
    const sub = await this.findSubscriptionById(id);
    return sub ? this.updateSubscription(sub.userId, { status: 'suspended' }) : null;
  },

  async submitManualPayment(data: { orderId?: string; userId?: string; email: string; planId: string; amount: number; utrNumber: string; notes?: string }) {
    const cleanEmail = data.email.toLowerCase().trim();
    const customer = await this.findUserByEmail(cleanEmail);
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('manual_payments').insert({
          order_id: data.orderId || crypto.randomUUID(),
          user_id: customer?.id || null,
          email: cleanEmail,
          plan_id: data.planId,
          amount: data.amount,
          utr_number: data.utrNumber.trim(),
          notes: data.notes?.slice(0, 1000)
        }).select().single());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase submitManualPayment fallback:', err.message);
      }
    }
    const id = 'mpay_' + crypto.randomBytes(6).toString('hex');
    const payment = {
      id,
      orderId: data.orderId || ('ORD-' + crypto.randomBytes(8).toString('hex').toUpperCase()),
      userId: customer?.id || data.userId,
      email: cleanEmail,
      planId: data.planId,
      amount: data.amount,
      utrNumber: data.utrNumber.trim(),
      status: 'pending',
      notes: data.notes,
      createdAt: new Date().toISOString()
    };
    memory.manualPayments.set(id, payment);
    return payment;
  },

  async getAllManualPayments() {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('manual_payments').select('*').order('created_at', { ascending: false }));
        if (rows && rows.length > 0) return rows.map(camel);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAllManualPayments fallback:', err.message);
      }
    }
    return Array.from(memory.manualPayments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async verifyManualPayment(paymentId: string, adminId: string) {
    const client = database();
    if (client) {
      try {
        const data = await result(client.rpc('approve_manual_payment', { p_payment_id: paymentId, p_admin_id: adminId }));
        if (data) {
          return { success: true, payment: camel(data.payment), user: camel(data.user), alreadyVerified: data.alreadyVerified };
        }
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase verifyManualPayment fallback:', err.message);
      }
    }
    const payment = memory.manualPayments.get(paymentId);
    if (!payment) throw new DatabaseError('Payment record not found.');
    if (payment.status === 'verified') {
      const user = payment.userId ? await this.findUserById(payment.userId) : await this.findUserByEmail(payment.email);
      return { success: true, payment, user: user ? safeUser(user) : null, alreadyVerified: true };
    }
    payment.status = 'verified';
    payment.verifiedAt = new Date().toISOString();
    payment.verifiedBy = adminId;
    memory.manualPayments.set(paymentId, payment);

    let user: (User & { passwordHash?: string }) | null = payment.userId ? await this.findUserById(payment.userId) : await this.findUserByEmail(payment.email);
    if (!user) {
      user = await this.createUser({
        email: payment.email,
        passwordHash: defaultPasswordHash,
        name: payment.email.split('@')[0],
        role: 'customer'
      });
    }
    const customerUser = user as User;
    payment.userId = customerUser.id;
    const durationDays = payment.planId === 'annual' ? 365 : 30;
    const sub = await this.getSubscription(customerUser.id);
    const baseEnd = sub && new Date(sub.currentPeriodEnd).getTime() > Date.now()
      ? new Date(sub.currentPeriodEnd).getTime()
      : Date.now();
    const newEnd = new Date(baseEnd + durationDays * oneDayMs).toISOString();

    await this.updateSubscription(customerUser.id, {
      planId: payment.planId,
      status: 'active',
      cancelAtPeriodEnd: false,
      maxDevices: 1,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: newEnd
    });

    await this.logAudit(customerUser.id, 'PAYMENT_APPROVED', `Payment ${payment.utrNumber} verified for ${payment.email}`);
    return { success: true, payment, user: safeUser(customerUser), alreadyVerified: false };
  },

  async grantPromo(userId: string, days: number, adminId: string): Promise<Subscription> {
    const sub = await this.getSubscription(userId);
    const baseEnd = sub && new Date(sub.currentPeriodEnd).getTime() > Date.now()
      ? new Date(sub.currentPeriodEnd).getTime()
      : Date.now();
    const newEnd = new Date(baseEnd + days * oneDayMs).toISOString();
    const updated = await this.updateSubscription(userId, {
      status: 'active',
      currentPeriodEnd: newEnd
    });
    await this.logAudit(userId, 'PROMO_GRANTED', `${days} promotional days granted by ${adminId}`);
    return updated;
  },

  async recordPaymentTransaction(data: Omit<PaymentTransaction, 'id' | 'createdAt'>) {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('payment_transactions').insert(snake(data)).select().single());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase recordPaymentTransaction fallback:', err.message);
      }
    }
    const id = 'tx_' + crypto.randomBytes(6).toString('hex');
    const tx: PaymentTransaction = {
      id,
      createdAt: new Date().toISOString(),
      ...data
    };
    memory.transactions.set(id, tx);
    return tx;
  },

  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('payment_transactions').select('*'));
        if (rows && rows.length > 0) return rows.map(camel);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAllPaymentTransactions fallback:', err.message);
      }
    }
    return Array.from(memory.transactions.values());
  },

  async getPaymentTransactionsByUser(userId: string): Promise<PaymentTransaction[]> {
    const all = await this.getAllPaymentTransactions();
    return all.filter(t => t.userId === userId);
  },

  async getDevicesByUser(userId: string): Promise<Device[]> {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('devices').select('*').eq('user_id', userId).neq('status', 'revoked'));
        if (rows && rows.length > 0) return rows.map(row => ({ ...camel(row), hardwareFingerprint: row.machine_hash }));
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getDevicesByUser fallback:', err.message);
      }
    }
    return Array.from(memory.devices.values()).filter(d => d.userId === userId && d.status !== 'revoked');
  },

  async getAllActiveDevices(): Promise<Device[]> {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('devices').select('*').neq('status', 'revoked'));
        if (rows && rows.length > 0) return rows.map(row => ({ ...camel(row), hardwareFingerprint: row.machine_hash }));
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAllActiveDevices fallback:', err.message);
      }
    }
    return Array.from(memory.devices.values()).filter(d => d.status !== 'revoked');
  },

  async revokeDevice(deviceId: string, actorId: string) {
    const client = database();
    if (client) {
      try {
        await result(client.from('devices').update({ status: 'revoked' }).eq('id', deviceId));
        return true;
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase revokeDevice fallback:', err.message);
      }
    }
    const dev = memory.devices.get(deviceId);
    if (!dev) return false;
    dev.status = 'revoked';
    memory.devices.set(deviceId, dev);
    return true;
  },

  async isWebhookEventProcessed(eventId: string) {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('webhook_events').select('id').eq('event_id', eventId).maybeSingle());
        return Boolean(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase isWebhookEventProcessed fallback:', err.message);
      }
    }
    return memory.webhookEvents.has(eventId);
  },

  async logWebhookEvent(eventId: string, eventType: string, status: string, summary: string, payload?: any) {
    const client = database();
    if (client) {
      try {
        return await result(client.from('webhook_events').upsert({ event_id: eventId, event_type: eventType, status, summary, payload }, { onConflict: 'event_id' }));
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase logWebhookEvent fallback:', err.message);
      }
    }
    memory.webhookEvents.set(eventId, { eventId, eventType, status, summary, payload, processedAt: new Date().toISOString() });
    return true;
  },

  async getRecentWebhookEvents(limit = 30) {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('webhook_events').select('*').order('processed_at', { ascending: false }).limit(limit));
        if (rows && rows.length > 0) return rows.map(camel);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getRecentWebhookEvents fallback:', err.message);
      }
    }
    return Array.from(memory.webhookEvents.values()).slice(0, limit);
  },

  async logAudit(userId: string | undefined, action: string, details: string, ipAddress?: string) {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('audit_logs').insert({ user_id: userId, action, details, ip_address: ipAddress }).select().single());
        if (row) return audit(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase logAudit fallback:', err.message);
      }
    }
    const log: AuditLog = {
      id: 'aud_' + crypto.randomBytes(6).toString('hex'),
      userId,
      action,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    };
    memory.auditLogs.unshift(log);
    return log;
  },

  async getAuditLogs(limit = 50) {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit));
        if (rows && rows.length > 0) return rows.map(audit);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getAuditLogs fallback:', err.message);
      }
    }
    return memory.auditLogs.slice(0, limit);
  },

  async getSupportNotes(userId: string) {
    const client = database();
    if (client) {
      try {
        const rows = await result<any[]>(client.from('support_notes').select('*').eq('user_id', userId).order('created_at'));
        if (rows && rows.length > 0) return rows.map(camel);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase getSupportNotes fallback:', err.message);
      }
    }
    return memory.supportNotes.filter(n => n.userId === userId);
  },

  async addSupportNote(userId: string, author: string, content: string) {
    const client = database();
    if (client) {
      try {
        const row = await result(client.from('support_notes').insert({ user_id: userId, author, content }).select().single());
        if (row) return camel(row);
      } catch (err: any) {
        if (!isSchemaError(err)) console.warn('[DB] Supabase addSupportNote fallback:', err.message);
      }
    }
    const note: SupportNote = {
      id: 'sn_' + crypto.randomBytes(6).toString('hex'),
      userId,
      author,
      content,
      createdAt: new Date().toISOString()
    };
    memory.supportNotes.push(note);
    return note;
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const [users, subs, devices] = await Promise.all([
      this.getAllUsers(),
      this.getAllSubscriptions(),
      this.getAllActiveDevices()
    ]);
    const nowTime = Date.now();
    const customers = new Set(users.filter(u => u.role === 'customer').map(u => u.id));
    const active = subs.filter(s => customers.has(s.userId) && hasActiveSubscription(s, nowTime));

    return {
      totalCustomers: customers.size,
      activeSubscriptions: active.length,
      trialUsers: subs.filter(s => customers.has(s.userId) && ['pending', 'trialing'].includes(getSubscriptionStatus(s, nowTime))).length,
      expiredSubscriptions: subs.filter(s => customers.has(s.userId) && getSubscriptionStatus(s, nowTime) === 'expired').length,
      failedPayments: subs.filter(s => customers.has(s.userId) && ['past_due', 'unpaid', 'halted'].includes(s.status)).length,
      mrr: active.reduce((sum, s) => sum + (s.planId === 'annual' ? 49999 / 12 : 4999), 0),
      activeLicenses: active.length,
      activeDevicesCount: devices.filter(d => d.lastHeartbeatAt && Date.parse(d.lastHeartbeatAt) > nowTime - 900000).length
    };
  },

  async getAllDatabaseTables() {
    const [users, subscriptions, devices, transactions, webhooks, auditLogs] = await Promise.all([
      this.getAllUsers(),
      this.getAllSubscriptions(),
      this.getAllActiveDevices(),
      this.getAllPaymentTransactions(),
      this.getRecentWebhookEvents(),
      this.getAuditLogs()
    ]);
    return {
      status: {
        mode: 'Supabase PostgreSQL with Local Engine Fallback',
        connected: true,
        totalUsers: users.length,
        totalSubscriptions: subscriptions.length,
        totalDevices: devices.length,
        totalTransactions: transactions.length,
        totalWebhooks: webhooks.length
      },
      tables: { users, subscriptions, devices, transactions, webhooks, auditLogs }
    };
  }
};
