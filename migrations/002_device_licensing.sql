-- Self-contained migration. Run in Supabase SQL Editor instead of the old demo
-- seed/export. Original tables are retained. No real license keys are seeded.
BEGIN;
CREATE TABLE IF NOT EXISTS public.qbot_users (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email TEXT NOT NULL UNIQUE,
 password_hash TEXT, name TEXT, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
 is_verified BOOLEAN NOT NULL DEFAULT false, two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS qbot_users_email_lower ON public.qbot_users(lower(email));
CREATE TABLE IF NOT EXISTS public.qbot_subscriptions (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
 user_id TEXT NOT NULL UNIQUE REFERENCES public.qbot_users(id) ON DELETE CASCADE,
 plan_id TEXT NOT NULL DEFAULT 'monthly' CHECK(plan_id IN ('trial','monthly','annual')),
 status TEXT NOT NULL DEFAULT 'inactive', provider TEXT NOT NULL DEFAULT 'manual',
 current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(), current_period_end TIMESTAMPTZ NOT NULL DEFAULT now(),
 cancel_at_period_end BOOLEAN NOT NULL DEFAULT false, max_devices INTEGER NOT NULL DEFAULT 1 CHECK(max_devices>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_manual_payments (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, order_id TEXT NOT NULL,
 user_id TEXT REFERENCES public.qbot_users(id) ON DELETE SET NULL, email TEXT NOT NULL,
 plan_id TEXT NOT NULL CHECK(plan_id IN ('monthly','annual')), amount NUMERIC(12,2) NOT NULL CHECK(amount>0),
 utr_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
 notes TEXT, verified_by TEXT REFERENCES public.qbot_users(id), verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_payment_transactions (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
 subscription_id TEXT REFERENCES public.qbot_subscriptions(id) ON DELETE SET NULL, provider TEXT NOT NULL DEFAULT 'manual',
 provider_payment_id TEXT UNIQUE, provider_order_id TEXT, amount NUMERIC(12,2) NOT NULL,
 currency TEXT NOT NULL DEFAULT 'INR', status TEXT NOT NULL, method TEXT, error_code TEXT, error_description TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_licenses (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
 subscription_id TEXT NOT NULL REFERENCES public.qbot_subscriptions(id) ON DELETE CASCADE,
 key_hash TEXT NOT NULL UNIQUE CHECK(key_hash ~ '^[a-f0-9]{64}$'), key_prefix TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','active','revoked')), device_id TEXT,
 expires_at TIMESTAMPTZ NOT NULL, issued_by TEXT REFERENCES public.qbot_users(id),
 issued_at TIMESTAMPTZ NOT NULL DEFAULT now(), activated_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS qbot_one_active_license ON public.qbot_licenses(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS qbot_licenses_customer ON public.qbot_licenses(user_id);
CREATE TABLE IF NOT EXISTS public.qbot_devices (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
 license_id TEXT NOT NULL REFERENCES public.qbot_licenses(id) ON DELETE CASCADE, device_name TEXT NOT NULL,
 device_type TEXT NOT NULL DEFAULT 'windows_backend', machine_hash TEXT NOT NULL CHECK(machine_hash ~ '^[a-f0-9]{64}$'),
 public_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online','offline','revoked')),
 ip_address TEXT, last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(), paired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_license_challenges (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, device_id TEXT NOT NULL, nonce TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '90 seconds'
);
CREATE INDEX IF NOT EXISTS qbot_challenge_expiry ON public.qbot_license_challenges(expires_at);
CREATE TABLE IF NOT EXISTS public.qbot_audit_logs (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT REFERENCES public.qbot_users(id) ON DELETE SET NULL,
 action TEXT NOT NULL, details TEXT, ip_address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_support_notes (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT NOT NULL REFERENCES public.qbot_users(id) ON DELETE CASCADE,
 author TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qbot_webhook_events (
 id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, event_id TEXT UNIQUE NOT NULL, event_type TEXT NOT NULL,
 status TEXT NOT NULL, summary TEXT, payload JSONB, processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Import either historical UUID or TEXT customer schemas without overwriting
-- records already migrated. A missing password requires the admin setup command.
DO $migration$
BEGIN
 IF to_regclass('public.users') IS NOT NULL THEN
  INSERT INTO public.qbot_users(id,email,password_hash,name,role,is_verified,created_at)
   SELECT j->>'id',lower(j->>'email'),j->>'password_hash',j->>'name',
    CASE WHEN j->>'role'='admin' THEN 'admin' ELSE 'customer' END,
    coalesce((j->>'is_verified')::boolean,false),coalesce((j->>'created_at')::timestamptz,now())
   FROM (SELECT to_jsonb(u) j FROM public.users u) legacy WHERE j->>'email' IS NOT NULL ON CONFLICT DO NOTHING;
 END IF;
 IF to_regclass('public.subscriptions') IS NOT NULL THEN
  INSERT INTO public.qbot_subscriptions(id,user_id,plan_id,status,provider,current_period_start,current_period_end,max_devices)
   SELECT j->>'id',j->>'user_id',coalesce(j->>'plan_id','monthly'),coalesce(j->>'status','inactive'),'manual',
    coalesce((j->>'current_period_start')::timestamptz,now()),coalesce((j->>'current_period_end')::timestamptz,now()),1
   FROM (SELECT to_jsonb(s) j FROM public.subscriptions s ORDER BY s.current_period_end DESC) legacy
   WHERE EXISTS(SELECT 1 FROM public.qbot_users u WHERE u.id=j->>'user_id') ON CONFLICT DO NOTHING;
 END IF;
END $migration$;

CREATE OR REPLACE FUNCTION public.qbot_register_user(p_email TEXT,p_password_hash TEXT,p_name TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE u qbot_users;
BEGIN
 INSERT INTO qbot_users(email,password_hash,name) VALUES(lower(trim(p_email)),p_password_hash,p_name) RETURNING * INTO u;
 INSERT INTO qbot_subscriptions(user_id) VALUES(u.id);
 RETURN to_jsonb(u);
END $$;

CREATE OR REPLACE FUNCTION public.qbot_approve_payment(p_payment_id TEXT,p_admin_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE p qbot_manual_payments; u qbot_users; s qbot_subscriptions;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM qbot_users WHERE id=p_admin_id AND role='admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 SELECT * INTO p FROM qbot_manual_payments WHERE id=p_payment_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
 SELECT * INTO u FROM qbot_users WHERE lower(email)=lower(p.email) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Customer must register with the payment email before approval'; END IF;
 IF p.status='verified' THEN RETURN jsonb_build_object('payment',to_jsonb(p),'user',to_jsonb(u)-'password_hash','alreadyVerified',true); END IF;
 IF p.status<>'pending' THEN RAISE EXCEPTION 'Payment is not pending'; END IF;
 INSERT INTO qbot_subscriptions(user_id) VALUES(u.id) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO s FROM qbot_subscriptions WHERE user_id=u.id FOR UPDATE;
 UPDATE qbot_subscriptions SET plan_id=p.plan_id,status='active',provider='manual',cancel_at_period_end=false,
  current_period_start=CASE WHEN s.current_period_end>now() THEN s.current_period_start ELSE now() END,
  current_period_end=greatest(s.current_period_end,now())+make_interval(days=>CASE WHEN p.plan_id='annual' THEN 365 ELSE 30 END),
  updated_at=now() WHERE id=s.id;
 UPDATE qbot_manual_payments SET user_id=u.id,status='verified',verified_by=p_admin_id,verified_at=now() WHERE id=p.id RETURNING * INTO p;
 INSERT INTO qbot_payment_transactions(user_id,subscription_id,provider_payment_id,provider_order_id,amount,status,method)
  VALUES(u.id,s.id,p.utr_number,p.order_id,p.amount,'captured','UPI_QR_MANUAL');
 INSERT INTO qbot_audit_logs(user_id,action,details) VALUES(u.id,'PAYMENT_APPROVED','Payment '||p.id||' approved by '||p_admin_id);
 RETURN jsonb_build_object('payment',to_jsonb(p),'user',to_jsonb(u)-'password_hash','alreadyVerified',false);
END $$;

CREATE OR REPLACE FUNCTION public.qbot_issue_license(p_user_id TEXT,p_key_hash TEXT,p_key_prefix TEXT,p_admin_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s qbot_subscriptions; l qbot_licenses;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM qbot_users WHERE id=p_admin_id AND role='admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM 1 FROM qbot_users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found'; END IF;
 SELECT * INTO s FROM qbot_subscriptions WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR s.status<>'active' OR s.current_period_start>now() OR s.current_period_end<=now() THEN
  RAISE EXCEPTION 'Approve payment or extend the subscription before issuing a key';
 END IF;
 UPDATE qbot_licenses SET status='revoked',revoked_at=now() WHERE user_id=p_user_id AND status='issued';
 INSERT INTO qbot_licenses(user_id,subscription_id,key_hash,key_prefix,expires_at,issued_by)
  VALUES(p_user_id,s.id,p_key_hash,p_key_prefix,s.current_period_end,p_admin_id) RETURNING * INTO l;
 INSERT INTO qbot_audit_logs(user_id,action,details) VALUES(p_user_id,'LICENSE_ISSUED','License '||l.id||' issued by '||p_admin_id);
 RETURN to_jsonb(l)-'key_hash';
END $$;

CREATE OR REPLACE FUNCTION public.qbot_license_lease(p_license_id TEXT,p_device_id TEXT,p_machine_hash TEXT,p_public_key TEXT,p_ip TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE l qbot_licenses; s qbot_subscriptions; d qbot_devices;
BEGIN
 SELECT * INTO l FROM qbot_licenses WHERE id=p_license_id;
 IF NOT FOUND OR l.status<>'active' OR l.device_id IS DISTINCT FROM p_device_id THEN RAISE EXCEPTION 'License revoked or not activated'; END IF;
 SELECT * INTO s FROM qbot_subscriptions WHERE id=l.subscription_id;
 IF NOT FOUND OR s.status<>'active' OR s.current_period_start>now() THEN RAISE EXCEPTION 'Subscription is not active'; END IF;
 IF least(s.current_period_end,l.expires_at)<=now() THEN RAISE EXCEPTION 'Subscription or license expired; enter your renewal key'; END IF;
 SELECT * INTO d FROM qbot_devices WHERE id=p_device_id;
 IF NOT FOUND OR d.status='revoked' OR d.user_id<>l.user_id OR d.license_id<>l.id
  OR d.machine_hash<>p_machine_hash OR d.public_key<>p_public_key THEN RAISE EXCEPTION 'Device authorization does not match'; END IF;
 UPDATE qbot_devices SET status='online',last_heartbeat_at=now(),ip_address=p_ip WHERE id=d.id;
 RETURN jsonb_build_object('licenseId',l.id,'customerId',l.user_id,'subscriptionId',s.id,'deviceId',d.id,
  'machineHash',d.machine_hash,'publicKey',d.public_key,'planId',s.plan_id,
  'subscriptionExpiresAt',least(s.current_period_end,l.expires_at),'serverTime',now());
END $$;

CREATE OR REPLACE FUNCTION public.qbot_activate_license(p_key_hash TEXT,p_device_id TEXT,p_machine_hash TEXT,p_public_key TEXT,p_device_name TEXT,p_challenge_id TEXT,p_ip TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE l qbot_licenses; s qbot_subscriptions; owner_id TEXT;
BEGIN
 SELECT user_id INTO owner_id FROM qbot_licenses WHERE key_hash=p_key_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid license key'; END IF;
 PERFORM 1 FROM qbot_users WHERE id=owner_id FOR UPDATE;
 SELECT * INTO l FROM qbot_licenses WHERE key_hash=p_key_hash FOR UPDATE;
 SELECT * INTO s FROM qbot_subscriptions WHERE id=l.subscription_id FOR UPDATE;
 IF s.status<>'active' OR s.current_period_start>now() OR least(s.current_period_end,l.expires_at)<=now() THEN
  RAISE EXCEPTION 'Subscription or license expired; contact the seller for a renewal key';
 END IF;
 DELETE FROM qbot_license_challenges WHERE id=p_challenge_id AND device_id=p_device_id AND expires_at>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'Challenge expired or already used'; END IF;
 IF l.status='revoked' THEN RAISE EXCEPTION 'License revoked'; END IF;
 IF l.status='active' AND l.device_id IS DISTINCT FROM p_device_id THEN RAISE EXCEPTION 'This key is already assigned to another PC'; END IF;
 IF EXISTS(SELECT 1 FROM qbot_devices WHERE id=p_device_id AND (user_id<>l.user_id OR machine_hash<>p_machine_hash OR public_key<>p_public_key)) THEN
  RAISE EXCEPTION 'Device identity does not match the saved activation';
 END IF;
 IF l.status='issued' THEN
  UPDATE qbot_licenses SET status='revoked',revoked_at=now() WHERE user_id=l.user_id AND status='active';
  UPDATE qbot_devices SET status='revoked' WHERE user_id=l.user_id AND id<>p_device_id;
  UPDATE qbot_licenses SET status='active',device_id=p_device_id,activated_at=now() WHERE id=l.id;
  INSERT INTO qbot_devices(id,user_id,license_id,device_name,machine_hash,public_key,ip_address)
   VALUES(p_device_id,l.user_id,l.id,p_device_name,p_machine_hash,p_public_key,p_ip)
   ON CONFLICT(id) DO UPDATE SET license_id=EXCLUDED.license_id,device_name=EXCLUDED.device_name,status='online';
  INSERT INTO qbot_audit_logs(user_id,action,details,ip_address) VALUES(l.user_id,'LICENSE_ACTIVATED','License '||l.id||' activated on '||p_device_id,p_ip);
 END IF;
 RETURN qbot_license_lease(l.id,p_device_id,p_machine_hash,p_public_key,p_ip);
END $$;

CREATE OR REPLACE FUNCTION public.qbot_refresh_license(p_license_id TEXT,p_device_id TEXT,p_machine_hash TEXT,p_public_key TEXT,p_challenge_id TEXT,p_ip TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE owner_id TEXT;
BEGIN
 SELECT user_id INTO owner_id FROM qbot_licenses WHERE id=p_license_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'License not found'; END IF;
 PERFORM 1 FROM qbot_users WHERE id=owner_id FOR UPDATE;
 DELETE FROM qbot_license_challenges WHERE id=p_challenge_id AND device_id=p_device_id AND expires_at>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'Challenge expired or already used'; END IF;
 RETURN qbot_license_lease(p_license_id,p_device_id,p_machine_hash,p_public_key,p_ip);
END $$;

CREATE OR REPLACE FUNCTION public.qbot_revoke_license(p_license_id TEXT,p_admin_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path=public AS $$
DECLARE owner_id TEXT;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM qbot_users WHERE id=p_admin_id AND role='admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 SELECT user_id INTO owner_id FROM qbot_licenses WHERE id=p_license_id;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM 1 FROM qbot_users WHERE id=owner_id FOR UPDATE;
 UPDATE qbot_licenses SET status='revoked',revoked_at=now() WHERE id=p_license_id;
 UPDATE qbot_devices SET status='revoked' WHERE license_id=p_license_id;
 INSERT INTO qbot_audit_logs(user_id,action,details) VALUES(owner_id,'LICENSE_REVOKED','License '||p_license_id||' revoked by '||p_admin_id);
 RETURN true;
END $$;

-- Only Render's service role can access licensing, including the RPC functions.
DO $permissions$
DECLARE t TEXT; f RECORD;
BEGIN
 FOREACH t IN ARRAY ARRAY['qbot_users','qbot_subscriptions','qbot_manual_payments','qbot_payment_transactions',
  'qbot_licenses','qbot_devices','qbot_license_challenges','qbot_audit_logs','qbot_support_notes','qbot_webhook_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon',t); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated',t); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t); END IF;
 END LOOP;
 FOR f IN SELECT oid::regprocedure signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE 'qbot_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.signature);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',f.signature); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated',f.signature); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature); END IF;
 END LOOP;
 -- Close permissive grants left by the former schema exporter; retain the data.
 FOREACH t IN ARRAY ARRAY['users','subscriptions','devices','payment_transactions','webhook_events','audit_logs','support_notes','manual_payments'] LOOP
  IF to_regclass('public.'||t) IS NOT NULL THEN
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon',t); END IF;
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated',t); END IF;
  END IF;
 END LOOP;
END $permissions$;
COMMIT;
