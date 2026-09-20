# Algo Trders.site - QBot2 Trading Deployment Guide

## 1. Production Architecture Overview

The system consists of three coordinated tiers:
1. **SaaS Website & Licensing Cloud API**: Hosted on Cloud Run / Node.js (or containerized server). Provides authentication, Stripe Billing, device pairing, and entitlement token signing.
2. **PostgreSQL Database**: Stores users, subscriptions, devices, audit logs, and processed webhook events.
3. **QBot2 Clients**:
   - **Windows PC Backend**: Local FastAPI service on port 8000 executing Supertrend algorithmic trades and validating entitlement with the Cloud API.
   - **Android Mobile App**: Connects directly to the Windows PC over local Wi-Fi to monitor trades, toggle parameters, and start/stop the bot.

---

## 2. Environment Variables Configuration

Create a production `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://qbot_admin:YOUR_SECURE_PASSWORD@postgres-host.internal:5432/qbot2_licensing?sslmode=require"

# JWT Token Secret (minimum 32 characters)
JWT_SECRET="e9f823a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef"

# Stripe Live Keys
STRIPE_SECRET_KEY="sk_live_51..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_MONTHLY="price_1..."
STRIPE_PRICE_YEARLY="price_1..."

# Product Downloads CDN/Storage
APP_DOWNLOAD_URL="https://releases.algotrders.site/qbot2-windows-v2.4.1.zip"
APK_DOWNLOAD_URL="https://releases.algotrders.site/qbot2-android-v2.1.0.apk"
```

---

## 3. Database Migrations

Apply the PostgreSQL schema located at `/migrations/001_initial_schema.sql`:

```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

---

## 4. Stripe Webhook Configuration

In your Stripe Dashboard:
1. Navigate to **Developers -> Webhooks**.
2. Add Endpoint: `https://algotrders.site/api/webhooks/stripe`
3. Select Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `charge.refunded`
4. Copy the Signing Secret into `STRIPE_WEBHOOK_SECRET`.

---

## 5. Build and Launch

```bash
# Install dependencies
npm install

# Production build
npm run build

# Start production server
npm start
```
