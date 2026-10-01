-- ==============================================================================
-- Algo Trders QBot2 - Unified Database Schema & Cleanup Migration
-- Target: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Single clean table structure (NO duplicate qbot_ tables)
-- Dedicated licenses table storing both plain-text raw_key and cryptographic key_hash
-- ==============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Table: users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alter existing columns if table was created in an older format
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.users ALTER COLUMN is_verified SET DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON public.users(lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- ==============================================================================
-- 2. Table: subscriptions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT NOT NULL DEFAULT 'manual',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  max_devices INTEGER NOT NULL DEFAULT 1,
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE TEXT;

-- Deduplicate any duplicate subscriptions per user if legacy records exist
DO $$
BEGIN
  DELETE FROM public.subscriptions a USING public.subscriptions b
  WHERE a.created_at < b.created_at AND a.user_id = b.user_id;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create unique index on user_id so ON CONFLICT (user_id) works reliably
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- ==============================================================================
-- 3. Dedicated License Table: licenses (Single table for key storage & verification)
-- Stores BOTH Plain-Text (raw_key) and Cryptographic Hash (key_hash)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.licenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  raw_key TEXT,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'active', 'revoked')),
  device_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  issued_by TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS raw_key TEXT;
ALTER TABLE public.licenses ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.licenses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.licenses ALTER COLUMN subscription_id TYPE TEXT;

CREATE INDEX IF NOT EXISTS licenses_user_id_idx ON public.licenses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS licenses_key_hash_idx ON public.licenses(key_hash);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON public.licenses(status);

-- ==============================================================================
-- 4. Table: devices
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  license_id TEXT,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'windows_backend',
  machine_hash TEXT NOT NULL,
  public_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  ip_address TEXT,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.devices ALTER COLUMN user_id TYPE TEXT;
CREATE INDEX IF NOT EXISTS devices_user_id_idx ON public.devices(user_id);

-- ==============================================================================
-- 5. Table: license_challenges
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.license_challenges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  device_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 seconds')
);

ALTER TABLE public.license_challenges ALTER COLUMN id TYPE TEXT;
CREATE INDEX IF NOT EXISTS license_challenges_device_idx ON public.license_challenges(device_id);
CREATE INDEX IF NOT EXISTS license_challenges_expires_at_idx ON public.license_challenges(expires_at);

-- ==============================================================================
-- 6. Table: manual_payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  utr_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_payments ALTER COLUMN id TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS manual_payments_utr_idx ON public.manual_payments(utr_number);
CREATE INDEX IF NOT EXISTS manual_payments_email_idx ON public.manual_payments(lower(email));

-- ==============================================================================
-- 7. Table: payment_transactions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.payment_transactions ALTER COLUMN user_id TYPE TEXT;
CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx ON public.payment_transactions(user_id);

-- ==============================================================================
-- 8. Table: audit_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ALTER COLUMN id TYPE TEXT;
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 9. Table: support_notes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_notes ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.support_notes ALTER COLUMN user_id TYPE TEXT;
CREATE INDEX IF NOT EXISTS support_notes_user_id_idx ON public.support_notes(user_id);

-- ==============================================================================
-- 10. Table: webhook_events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed',
  summary TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ALTER COLUMN id TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_event_id_unique_idx ON public.webhook_events(event_id);

-- ==============================================================================
-- 11. DATA MIGRATION: Migrate records safely from qbot_* tables
-- ==============================================================================
DO $migrate_data$
BEGIN
  -- 1. Migrate qbot_users -> users
  IF to_regclass('public.qbot_users') IS NOT NULL THEN
    INSERT INTO public.users (id, email, password_hash, name, role, is_verified, two_factor_enabled, created_at, updated_at)
    SELECT id::text, lower(trim(email)), password_hash, name, role, is_verified, two_factor_enabled, created_at, updated_at
    FROM public.qbot_users
    ON CONFLICT (email) DO UPDATE
    SET password_hash = coalesce(EXCLUDED.password_hash, users.password_hash),
        name = coalesce(EXCLUDED.name, users.name),
        role = EXCLUDED.role,
        is_verified = true;
  END IF;

  -- 2. Migrate qbot_subscriptions -> subscriptions
  IF to_regclass('public.qbot_subscriptions') IS NOT NULL THEN
    INSERT INTO public.subscriptions (id, user_id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, max_devices, created_at, updated_at)
    SELECT s.id::text, s.user_id::text, s.plan_id, s.status, s.provider, s.current_period_start, s.current_period_end, s.cancel_at_period_end, s.max_devices, s.created_at, s.updated_at
    FROM public.qbot_subscriptions s
    WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = s.user_id::text)
      AND NOT EXISTS (SELECT 1 FROM public.subscriptions sub WHERE sub.user_id::text = s.user_id::text);
  END IF;

  -- 3. Migrate qbot_licenses -> licenses
  IF to_regclass('public.qbot_licenses') IS NOT NULL THEN
    INSERT INTO public.licenses (id, user_id, subscription_id, raw_key, key_hash, key_prefix, status, device_id, expires_at, issued_by, issued_at, activated_at, revoked_at)
    SELECT l.id::text, l.user_id::text, l.subscription_id::text, 
           coalesce(l.raw_key, l.key_prefix), l.key_hash, l.key_prefix, l.status, l.device_id, l.expires_at, l.issued_by::text, l.issued_at, l.activated_at, l.revoked_at
    FROM public.qbot_licenses l
    WHERE NOT EXISTS (SELECT 1 FROM public.licenses lic WHERE lic.key_hash = l.key_hash);
  END IF;

  -- 4. Migrate qbot_devices -> devices
  IF to_regclass('public.qbot_devices') IS NOT NULL THEN
    INSERT INTO public.devices (id, user_id, license_id, device_name, device_type, machine_hash, public_key, status, ip_address, last_heartbeat_at, paired_at)
    SELECT d.id::text, d.user_id::text, d.license_id::text, d.device_name, d.device_type, d.machine_hash, d.public_key, d.status, d.ip_address, d.last_heartbeat_at, d.paired_at
    FROM public.qbot_devices d
    WHERE NOT EXISTS (SELECT 1 FROM public.devices dev WHERE dev.id = d.id::text);
  END IF;

  -- 5. Migrate qbot_manual_payments -> manual_payments
  IF to_regclass('public.qbot_manual_payments') IS NOT NULL THEN
    INSERT INTO public.manual_payments (id, order_id, user_id, email, plan_id, amount, utr_number, status, notes, verified_by, verified_at, created_at)
    SELECT p.id::text, p.order_id, p.user_id::text, p.email, p.plan_id, p.amount, p.utr_number, p.status, p.notes, p.verified_by::text, p.verified_at, p.created_at
    FROM public.qbot_manual_payments p
    WHERE NOT EXISTS (SELECT 1 FROM public.manual_payments mp WHERE mp.utr_number = p.utr_number);
  END IF;
END $migrate_data$;

-- ==============================================================================
-- 12. CLEANUP: DROP all duplicate qbot_* tables to keep only ONE clean type
-- ==============================================================================
DROP TABLE IF EXISTS public.qbot_license_challenges CASCADE;
DROP TABLE IF EXISTS public.qbot_webhook_events CASCADE;
DROP TABLE IF EXISTS public.qbot_support_notes CASCADE;
DROP TABLE IF EXISTS public.qbot_audit_logs CASCADE;
DROP TABLE IF EXISTS public.qbot_payment_transactions CASCADE;
DROP TABLE IF EXISTS public.qbot_manual_payments CASCADE;
DROP TABLE IF EXISTS public.qbot_devices CASCADE;
DROP TABLE IF EXISTS public.qbot_licenses CASCADE;
DROP TABLE IF EXISTS public.qbot_subscriptions CASCADE;
DROP TABLE IF EXISTS public.qbot_users CASCADE;

-- Drop legacy qbot_* functions
DROP FUNCTION IF EXISTS public.qbot_register_user CASCADE;
DROP FUNCTION IF EXISTS public.qbot_approve_payment CASCADE;
DROP FUNCTION IF EXISTS public.qbot_issue_license CASCADE;
DROP FUNCTION IF EXISTS public.qbot_license_lease CASCADE;
DROP FUNCTION IF EXISTS public.qbot_activate_license CASCADE;
DROP FUNCTION IF EXISTS public.qbot_refresh_license CASCADE;
DROP FUNCTION IF EXISTS public.qbot_revoke_license CASCADE;
DROP FUNCTION IF EXISTS public.qbot_revoke_device CASCADE;
DROP FUNCTION IF EXISTS public.qbot_grant_promo CASCADE;

-- ==============================================================================
-- 13. Stored Procedures for Visitor Signup & Licensing (Unified Standard Names)
-- ==============================================================================

-- Visitor Registration Procedure
CREATE OR REPLACE FUNCTION public.register_user(p_email TEXT, p_password_hash TEXT, p_name TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  u users;
  sub subscriptions;
BEGIN
  INSERT INTO users (email, password_hash, name, role, is_verified)
  VALUES (lower(trim(p_email)), p_password_hash, trim(p_name), 'customer', true)
  RETURNING * INTO u;

  INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
  VALUES (u.id, 'monthly', 'active', now() + interval '30 days')
  RETURNING * INTO sub;

  RETURN jsonb_build_object(
    'user', to_jsonb(u) - 'password_hash',
    'subscription', to_jsonb(sub)
  );
END $$;

-- Manual Payment Approval
CREATE OR REPLACE FUNCTION public.approve_manual_payment(p_payment_id TEXT, p_admin_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  p manual_payments;
  u users;
  s subscriptions;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Administrator required';
  END IF;

  SELECT * INTO p FROM manual_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;

  SELECT * INTO u FROM users WHERE lower(email) = lower(p.email) FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO users (email, password_hash, name, role, is_verified)
    VALUES (lower(p.email), '$2a$10$v7g03Ucg6583J5j7M62HVO0X3yQGj1u1bW8n855C6l6G0fCjS9GgK', split_part(p.email, '@', 1), 'customer', true)
    RETURNING * INTO u;
  END IF;

  IF p.status = 'verified' THEN
    RETURN jsonb_build_object('payment', to_jsonb(p), 'user', to_jsonb(u) - 'password_hash', 'alreadyVerified', true);
  END IF;

  INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
  VALUES (u.id, p.plan_id, 'active', now() + interval '30 days')
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_end = greatest(subscriptions.current_period_end, now()) + make_interval(days => CASE WHEN p.plan_id = 'annual' THEN 365 ELSE 30 END)
  RETURNING * INTO s;

  UPDATE manual_payments
  SET user_id = u.id, status = 'verified', verified_by = p_admin_id, verified_at = now()
  WHERE id = p.id
  RETURNING * INTO p;

  INSERT INTO audit_logs (user_id, action, details)
  VALUES (u.id, 'PAYMENT_APPROVED', 'Payment ' || p.utr_number || ' approved by ' || p_admin_id);

  RETURN jsonb_build_object('payment', to_jsonb(p), 'user', to_jsonb(u) - 'password_hash', 'alreadyVerified', false);
END $$;

-- License Key Issuance (Stores Plain-text raw_key & SHA-256 key_hash in ONE table)
CREATE OR REPLACE FUNCTION public.issue_license(
  p_user_id TEXT,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_admin_id TEXT,
  p_raw_key TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  s subscriptions;
  l licenses;
BEGIN
  SELECT * INTO s FROM subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
    VALUES (p_user_id, 'monthly', 'active', now() + interval '30 days')
    RETURNING * INTO s;
  END IF;

  UPDATE licenses SET status = 'revoked', revoked_at = now()
  WHERE user_id = p_user_id AND status = 'issued';

  INSERT INTO licenses (
    user_id,
    subscription_id,
    raw_key,
    key_hash,
    key_prefix,
    status,
    expires_at,
    issued_by
  )
  VALUES (
    p_user_id,
    s.id,
    coalesce(p_raw_key, p_key_prefix),
    p_key_hash,
    p_key_prefix,
    'issued',
    s.current_period_end,
    p_admin_id
  )
  RETURNING * INTO l;

  INSERT INTO audit_logs (user_id, action, details)
  VALUES (p_user_id, 'LICENSE_ISSUED', 'License key generated (raw & hash saved) by ' || coalesce(p_admin_id, 'Admin'));

  RETURN to_jsonb(l);
END $$;

-- Seed Admin Account (akrambro11@gmail.com / Humhiraja@11)
INSERT INTO public.users (id, email, password_hash, name, role, is_verified)
VALUES (
  'usr_admin_akram',
  'akrambro11@gmail.com',
  '$2a$10$v7g03Ucg6583J5j7M62HVO0X3yQGj1u1bW8n855C6l6G0fCjS9GgK',
  'Akram (Admin)',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', is_verified = true;

-- Enable RLS and grant service_role permissions
DO $perms$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'subscriptions', 'licenses', 'devices',
    'license_challenges', 'manual_payments', 'payment_transactions',
    'audit_logs', 'support_notes', 'webhook_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
    END IF;
  END LOOP;
END $perms$;

COMMIT;
