import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './db.ts';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return null;
  }
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('[Supabase] Initialized client for:', url);
    } catch (err: any) {
      console.warn('[Supabase] Failed to initialize client:', err.message);
      supabaseClient = null;
    }
  }
  return supabaseClient;
};

export const testSupabaseConnection = async (): Promise<{ connected: boolean; message: string; tablesCount?: number }> => {
  const client = getSupabaseClient();
  const { url } = getSupabaseConfig();

  if (!client || !url) {
    return {
      connected: false,
      message: 'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY.'
    };
  }

  try {
    const { data, error } = await client.from('users').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: true,
          message: `Connected to Supabase (${url}), but tables have not been created yet. Run the SQL schema in Supabase SQL Editor.`
        };
      }
      return {
        connected: false,
        message: `Supabase query error: ${error.message} (Code: ${error.code})`
      };
    }

    return {
      connected: true,
      message: `Connected successfully to Supabase: ${url}`
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Supabase network/connection error: ${err.message}`
    };
  }
};

/**
 * Generates ready-to-run PostgreSQL schema & seed script for Supabase SQL Editor
 */
export const generateSupabaseSQL = async (): Promise<string> => {
  const data = await db.getAllDatabaseTables();
  const { users, subscriptions, devices, transactions, webhooks, auditLogs } = data.tables;

  const sanitizeStr = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') {
      if (val instanceof Date) {
        return `'${val.toISOString()}'`;
      }
      return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    }
    const str = String(val);
    return `'${str.replace(/'/g, "''")}'`;
  };

  let sql = `-- ==============================================================================
-- AlgoTraders QBot2 Database Schema & Initial Data for Supabase (PostgreSQL)
-- Target: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  razorpay_plan_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  max_devices INTEGER NOT NULL DEFAULT 2,
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  hardware_fingerprint TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  last_heartbeat_at TIMESTAMPTZ,
  paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed',
  summary TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) optionally
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_notes ENABLE ROW LEVEL SECURITY;

-- Allow server service role full access policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_users') THEN
    CREATE POLICY service_role_all_users ON public.users FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_subscriptions') THEN
    CREATE POLICY service_role_all_subscriptions ON public.subscriptions FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_devices') THEN
    CREATE POLICY service_role_all_devices ON public.devices FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_transactions') THEN
    CREATE POLICY service_role_all_transactions ON public.payment_transactions FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_webhooks') THEN
    CREATE POLICY service_role_all_webhooks ON public.webhook_events FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_audit') THEN
    CREATE POLICY service_role_all_audit ON public.audit_logs FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_support') THEN
    CREATE POLICY service_role_all_support ON public.support_notes FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- 2. Initial Seed Data
`;

  if (users.length > 0) {
    sql += `\n-- Seed Users\nINSERT INTO public.users (id, email, name, role, is_verified, two_factor_enabled, created_at)\nVALUES\n`;
    sql += users.map((u: any) =>
      `  (${sanitizeStr(u.id)}, ${sanitizeStr(u.email)}, ${sanitizeStr(u.name)}, ${sanitizeStr(u.role)}, ${u.isVerified ? 'TRUE' : 'FALSE'}, ${u.twoFactorEnabled ? 'TRUE' : 'FALSE'}, ${sanitizeStr(u.createdAt)})`
    ).join(',\n');
    sql += `\nON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;\n`;
  }

  if (subscriptions.length > 0) {
    sql += `\n-- Seed Subscriptions\nINSERT INTO public.subscriptions (id, user_id, plan_id, status, provider, razorpay_subscription_id, razorpay_customer_id, razorpay_plan_id, current_period_start, current_period_end, cancel_at_period_end, max_devices, payment_method_last4, payment_method_brand, created_at)\nVALUES\n`;
    sql += subscriptions.map((s: any) =>
      `  (${sanitizeStr(s.id)}, ${sanitizeStr(s.userId)}, ${sanitizeStr(s.planId)}, ${sanitizeStr(s.status)}, ${sanitizeStr(s.provider || 'razorpay')}, ${sanitizeStr(s.razorpaySubscriptionId)}, ${sanitizeStr(s.razorpayCustomerId)}, ${sanitizeStr(s.razorpayPlanId)}, ${sanitizeStr(s.currentPeriodStart)}, ${sanitizeStr(s.currentPeriodEnd)}, ${s.cancelAtPeriodEnd ? 'TRUE' : 'FALSE'}, ${s.maxDevices || 2}, ${sanitizeStr(s.paymentMethodLast4)}, ${sanitizeStr(s.paymentMethodBrand)}, ${sanitizeStr(s.createdAt)})`
    ).join(',\n');
    sql += `\nON CONFLICT (id) DO NOTHING;\n`;
  }

  if (devices.length > 0) {
    sql += `\n-- Seed Devices\nINSERT INTO public.devices (id, user_id, device_name, device_type, hardware_fingerprint, ip_address, status, last_heartbeat_at, paired_at)\nVALUES\n`;
    sql += devices.map((d: any) =>
      `  (${sanitizeStr(d.id)}, ${sanitizeStr(d.userId)}, ${sanitizeStr(d.deviceName)}, ${sanitizeStr(d.deviceType)}, ${sanitizeStr(d.hardwareFingerprint)}, ${sanitizeStr(d.ipAddress)}, ${sanitizeStr(d.status)}, ${sanitizeStr(d.lastHeartbeatAt)}, ${sanitizeStr(d.pairedAt)})`
    ).join(',\n');
    sql += `\nON CONFLICT (id) DO NOTHING;\n`;
  }

  return sql;
};
