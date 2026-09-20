# Algo Trders.site - QBot2 Licensing & Cloud API Documentation

Base URL: `https://algotrders.site/api`

## Authentication

All protected endpoints require the HTTP header:
`Authorization: Bearer <jwt_token>`

### Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new customer account (7-day free trial auto-provisioned) | Public |
| `POST` | `/api/auth/login` | Authenticate customer or admin. Returns JWT & 2FA prompt if enabled | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & active device count | Authenticated |
| `POST` | `/api/auth/toggle-2fa` | Enable/Disable two-factor authentication | Authenticated |
| `GET` | `/api/auth/export-data` | GDPR/Privacy data export in JSON | Authenticated |
| `POST` | `/api/auth/delete-account` | GDPR right-to-be-forgotten deletion | Authenticated |

---

## Subscriptions & Billing

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/subscription` | Get current plan, entitlement status, device limits | Authenticated |
| `POST` | `/api/billing/create-checkout-session` | Create Stripe checkout session for `monthly` or `annual` | Authenticated |
| `POST` | `/api/billing/create-customer-portal` | Open Stripe Customer Portal for billing management | Authenticated |
| `POST` | `/api/webhooks/stripe` | Server-side Stripe webhook processor with signature validation | Stripe only |

---

## Device Pairing

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/devices` | List user's paired devices with IP and heartbeat | Authenticated |
| `POST` | `/api/devices/generate-code` | Generates a 6-digit short-lived activation code (e.g., `QB-8942`) | Authenticated |
| `POST` | `/api/devices/pair` | Validates activation code from Windows backend or Android app | Rate-limited |
| `DELETE` | `/api/devices/:id` | Revokes device authorization immediately | Authenticated |

---

## Downloads

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/downloads` | Returns authorized download links for Windows backend and Android APK if user has active entitlement | Authenticated |

---

## QBot2 PC Backend Licensing Verification

| Method | Path | Description | Access |
|---|---|---|---|
| `POST` | `/api/license/validate` | Validates `deviceId` & `hardwareFingerprint`, returns signed `tradingAllowed` flag and grace period | Windows PC Engine |
| `POST` | `/api/license/heartbeat` | Periodic ping to record last seen status and client IP | Windows PC Engine |

---

## Admin Endpoints (RBAC: `role === 'admin'`)

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | System overview: ARR, MRR, subscriptions, active devices | Admin only |
| `GET` | `/api/admin/users` | List all accounts with device and subscription details | Admin only |
| `POST` | `/api/admin/users/:id/suspend` | Suspend customer access | Admin only |
| `POST` | `/api/admin/users/:id/reactivate` | Reactivate customer access | Admin only |
| `POST` | `/api/admin/users/:id/grant-promo` | Add free promotional days to customer subscription | Admin only |
| `DELETE` | `/api/admin/devices/:id` | Admin revocation of any device | Admin only |
| `GET` | `/api/admin/webhooks` | Audit logs of incoming Stripe webhook events | Admin only |
| `POST` | `/api/admin/support-notes` | Add admin support memo to customer profile | Admin only |
