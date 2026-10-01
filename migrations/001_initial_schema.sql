-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Application: Algo Trders.site (QBot2 Trading Licensing & SaaS)
-- Dialect: PostgreSQL 14+
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150),
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(128),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(32) NOT NULL DEFAULT 'trial' CHECK (plan_id IN ('trial', 'monthly', 'annual')),
    status VARCHAR(32) NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'trialing', 'pending', 'past_due', 'halted', 'canceled', 'unpaid', 'expired', 'suspended')),
    provider VARCHAR(32) NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay', 'cashfree', 'stripe')),
    razorpay_subscription_id VARCHAR(128),
    razorpay_customer_id VARCHAR(128),
    razorpay_plan_id VARCHAR(128),
    stripe_customer_id VARCHAR(128),
    stripe_subscription_id VARCHAR(128),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    max_devices INTEGER NOT NULL DEFAULT 2,
    payment_method_last4 VARCHAR(8),
    payment_method_brand VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: devices
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(128) NOT NULL,
    device_type VARCHAR(32) NOT NULL CHECK (device_type IN ('windows_backend', 'android_mobile')),
    hardware_fingerprint VARCHAR(255),
    activation_code VARCHAR(16),
    code_expires_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'revoked')),
    ip_address VARCHAR(64),
    last_heartbeat_at TIMESTAMPTZ,
    paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: webhook_events (for idempotent Stripe event tracking)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(128) UNIQUE NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
    summary TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: support_notes (Admin only notes on accounts)
CREATE TABLE IF NOT EXISTS support_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade-safe additions for databases created by the previous schema.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider VARCHAR(32) NOT NULL DEFAULT 'razorpay';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(128);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(128);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_plan_id VARCHAR(128);
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'trialing', 'pending', 'past_due', 'halted', 'canceled', 'unpaid', 'expired', 'suspended'));

-- Indexes for high throughput performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_activation_code ON devices(activation_code);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Pairing codes are short-lived credentials and must not be stored in the
-- customer process or in the browser.
CREATE TABLE IF NOT EXISTS pairing_codes (
    code VARCHAR(16) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(32) NOT NULL CHECK (device_type IN ('windows_backend', 'android_mobile', 'android_app')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_expiry ON pairing_codes(expires_at);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    provider VARCHAR(32) NOT NULL,
    provider_payment_id VARCHAR(128),
    provider_order_id VARCHAR(128),
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL CHECK (status IN ('captured','failed','refunded','pending')),
    method VARCHAR(64),
    error_code VARCHAR(128),
    error_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_payment_id);
