-- Apply after 002_device_licensing.sql. Existing keys and paid periods are preserved.
BEGIN;

-- Device revocation takes the same customer lock as activation and refresh, so
-- a concurrent heartbeat cannot restore a revoked device to "online".
CREATE OR REPLACE FUNCTION public.qbot_revoke_device(p_device_id TEXT,p_actor_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path=public AS $$
DECLARE owner_id TEXT;
BEGIN
 SELECT user_id INTO owner_id FROM qbot_devices WHERE id=p_device_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF owner_id IS DISTINCT FROM p_actor_id AND NOT EXISTS(
  SELECT 1 FROM qbot_users WHERE id=p_actor_id AND role='admin'
 ) THEN RETURN false; END IF;
 PERFORM 1 FROM qbot_users WHERE id=owner_id FOR UPDATE;
 UPDATE qbot_devices SET status='revoked' WHERE id=p_device_id;
 UPDATE qbot_licenses SET status='revoked',revoked_at=now()
  WHERE user_id=owner_id AND device_id=p_device_id AND status<>'revoked';
 INSERT INTO qbot_audit_logs(user_id,action,details)
  VALUES(owner_id,'DEVICE_REVOKED','Device '||p_device_id||' revoked by '||p_actor_id);
 RETURN true;
END $$;

-- Promotional extensions and payment approval must not overwrite each other's
-- paid time. Existing keys keep their expiry until a new key is activated.
CREATE OR REPLACE FUNCTION public.qbot_grant_promo(p_user_id TEXT,p_days INTEGER,p_admin_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s qbot_subscriptions;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM qbot_users WHERE id=p_admin_id AND role='admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF p_days IS NULL OR p_days<1 OR p_days>365 THEN RAISE EXCEPTION 'Choose between 1 and 365 promotional days'; END IF;
 PERFORM 1 FROM qbot_users WHERE id=p_user_id AND role='customer' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found'; END IF;
 INSERT INTO qbot_subscriptions(user_id) VALUES(p_user_id) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO s FROM qbot_subscriptions WHERE user_id=p_user_id FOR UPDATE;
 UPDATE qbot_subscriptions SET status='active',cancel_at_period_end=false,
  plan_id=CASE WHEN s.plan_id='trial' THEN 'monthly' ELSE s.plan_id END,
  current_period_start=CASE WHEN s.current_period_end>now() THEN least(s.current_period_start,now()) ELSE now() END,
  current_period_end=greatest(s.current_period_end,now())+make_interval(days=>p_days),updated_at=now()
  WHERE id=s.id RETURNING * INTO s;
 INSERT INTO qbot_audit_logs(user_id,action,details)
  VALUES(p_user_id,'PROMO_GRANTED',p_days||' days granted by '||p_admin_id||' until '||s.current_period_end);
 RETURN to_jsonb(s);
END $$;

REVOKE ALL ON FUNCTION public.qbot_revoke_device(TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.qbot_grant_promo(TEXT,INTEGER,TEXT) FROM PUBLIC;
DO $permissions$
DECLARE f TEXT; r TEXT;
BEGIN
 FOREACH f IN ARRAY ARRAY['public.qbot_revoke_device(text,text)','public.qbot_grant_promo(text,integer,text)'] LOOP
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f,r); END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f); END IF;
 END LOOP;
END $permissions$;
COMMIT;
