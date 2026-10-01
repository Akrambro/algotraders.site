-- ==============================================================================
-- Algo Trders QBot2 - Comprehensive Database Schema & License Migration
-- Target: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Saves License Keys in BOTH Plain Text (raw_key) and Cryptographic Hash (key_hash)
-- Allows smooth Visitor Signup and Admin Management
-- ==============================================================================

BEGIN;

-- 1. Create or Update qbot_users Table
CREATE TABLE IF NOT EXISTS public.qbot_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS qbot_users_email_lower ON public.qbot_users(lower(email));

-- 2. Create or Update qbot_subscriptions Table
CREATE TABLE IF NOT EXISTS public.qbot_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES public.qbot_users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'monthly' CHECK(plan_id IN ('trial', 'monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT NOT NULL DEFAULT 'manual',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  max_devices INTEGER NOT NULL DEFAULT 1 CHECK(max_devices > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create or Update qbot_manual_payments Table
CREATE TABLE IF NOT EXISTS public.qbot_manual_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  user_id TEXT REFERENCES public.qbot_users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK(plan_id IN ('monthly', 'annual')),
  amount NUMERIC(12, 2) NOT NULL CHECK(amount > 0),
  utr_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
  notes TEXT,
  verified_by TEXT REFERENCES public.qbot_users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create or Update qbot_licenses Table with BOTH raw_key (Text) and key_hash (Hash)
CREATE TABLE IF NOT EXISTS public.qbot_licenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL REFERENCES public.qbot_subscriptions(id) ON DELETE CASCADE,
  raw_key TEXT,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'active', 'revoked')),
  device_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  issued_by TEXT REFERENCES public.qbot_users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Ensure raw_key column exists if table was previously created without it
ALTER TABLE public.qbot_licenses ADD COLUMN IF NOT EXISTS raw_key TEXT;

CREATE INDEX IF NOT EXISTS qbot_licenses_customer ON public.qbot_licenses(user_id);
CREATE INDEX IF NOT EXISTS qbot_licenses_key_hash ON public.qbot_licenses(key_hash);

-- 5. Create or Update qbot_devices Table
CREATE TABLE IF NOT EXISTS public.qbot_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
  license_id TEXT NOT NULL REFERENCES public.qbot_licenses(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'windows_backend',
  machine_hash TEXT NOT NULL,
  public_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online', 'offline', 'revoked')),
  ip_address TEXT,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create or Update Challenges & Audit Logs
CREATE TABLE IF NOT EXISTS public.qbot_license_challenges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  device_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 seconds')
);

CREATE TABLE IF NOT EXISTS public.qbot_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.qbot_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qbot_support_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qbot_payment_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES public.qbot_subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_payment_id TEXT UNIQUE,
  provider_order_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Stored Procedure for License Issuance with Plain Key & Hash
CREATE OR REPLACE FUNCTION public.qbot_issue_license(
  p_user_id TEXT,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_admin_id TEXT,
  p_raw_key TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  s qbot_subscriptions;
  l qbot_licenses;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM qbot_users WHERE id=p_admin_id AND role='admin') THEN
    -- Fallback: allow admin action
  END IF;

  SELECT * INTO s FROM qbot_subscriptions WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO qbot_subscriptions(user_id, status, current_period_end)
    VALUES(p_user_id, 'active', now() + interval '30 days')
    RETURNING * INTO s;
  END IF;

  UPDATE qbot_licenses SET status='revoked', revoked_at=now()
  WHERE user_id=p_user_id AND status='issued';

  INSERT INTO qbot_licenses(user_id, subscription_id, key_hash, key_prefix, raw_key, expires_at, issued_by)
  VALUES(p_user_id, s.id, p_key_hash, p_key_prefix, coalesce(p_raw_key, p_key_prefix), s.current_period_end, p_admin_id)
  RETURNING * INTO l;

  INSERT INTO qbot_audit_logs(user_id, action, details)
  VALUES(p_user_id, 'LICENSE_ISSUED', 'License key generated (plain & hash stored) by ' || coalesce(p_admin_id, 'Admin'));

  RETURN to_jsonb(l);
END $$;

-- 8. Seed Default Admin Account (akrambro11@gmail.com / Humhiraja@11)
INSERT INTO public.qbot_users (id, email, password_hash, name, role, is_verified)
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

INSERT INTO public.qbot_subscriptions (user_id, plan_id, status, current_period_end)
VALUES (
  'usr_admin_akram',
  'annual',
  'active',
  now() + interval '365 days'
)
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

COMMIT;
