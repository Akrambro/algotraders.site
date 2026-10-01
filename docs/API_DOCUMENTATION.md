# QBot2 licensing and downloads API

Client license API base URL and JWT issuer: `https://algotraders-ena2.onrender.com`. A custom website domain must route to that same current service; the Windows client pins the issuer and bundled public key. Website routes require `Authorization: Bearer <login token>` where marked. Registration creates an inactive account; approved manual payment grants a paid subscription. Download entitlement and device activation are separate checks.

## Windows activation

The seller issues a private `QB2-...` key after approving payment. Enter it in `QBotBackend.exe` or the Android activation screen connected to that PC. There are no browser-generated activation codes. One Windows PC can be active at a time; renewal or moving PCs requires a new seller-issued key.

| Method | Path | Behavior | Access |
|---|---|---|---|
| POST | `/api/license/challenge` | Obtain a short-lived challenge for a device identity | Rate limited |
| POST | `/api/license/activate` | Redeem a seller-issued key with a signed challenge and PC identity | Device proof |
| POST | `/api/license/refresh` | Refresh the existing PC's authorization | Device proof |
| GET | `/api/auth/me` | Current account, subscription, devices and that customer's license summaries; never raw keys or key hashes | Login |
| GET | `/api/devices` | List the account's registered devices | Login |
| DELETE | `/api/devices/:id` | Atomically revoke an owned device and its bound keys | Login |
| POST | `/api/devices/generate-code`, `/api/devices/pair` | Retired; returns HTTP 410 with activation guidance | No pairing performed |

`/api/license/validate` and `/api/license/heartbeat` accept the current signed refresh protocol. The old device-ID-only protocol cannot authorize trading. Use `licensing_client.py` from the main project for the challenge/signature protocol; the old Python example in this docs folder is retired.

Successful activation/refresh returns an RS256-signed authorization bound to the PC's identity and subscription. The Windows client verifies it with the bundled public key. Starting trading requires an online check. Existing authorization lasts at most 15 minutes, bounded by paid expiry; there is no 12-hour offline entitlement.

## Downloads

| Method | Path | Behavior | Access |
|---|---|---|---|
| GET | `/api/downloads` | Entitlement and Windows/Android metadata; links are empty unless the release is configured and the account is entitled | Login |
| GET | `/api/downloads/file/windows` | Verified licensed Windows ZIP attachment | Login and active paid period |
| GET | `/api/downloads/file/android` | Verified Android APK attachment | Login and active paid period |

Only explicit `LICENSED_WINDOWS_DOWNLOAD_*` / `LICENSED_ANDROID_DOWNLOAD_*` settings are used. HTTPS URLs and full SHA-256 hashes are required. Returned URLs point to the authenticated same-site endpoints. Storage URLs are not exposed in the catalog. File bytes are sent only after full checksum verification and a second subscription check.

Missing or invalid authentication returns 401; absent, trial, future, expired or suspended entitlement returns 403 on file requests. Unknown platforms return 404. Missing release configuration, storage failures, corrupt bytes or database failures return 503. Downloads are not cached and never redirect to a fallback artifact.

## License administration

| Method | Path | Behavior | Access |
|---|---|---|---|
| GET | `/api/admin/licenses` | List licenses, optionally filtered by `userId`; no raw keys returned | Current database admin role |
| GET | `/api/admin/audit-logs` | Latest 50 account, payment and licensing events | Current database admin role |
| POST | `/api/admin/verify-manual-payment` | Approve `paymentId` once; returns customer and `alreadyVerified`, without issuing a key | Current database admin role |
| POST | `/api/admin/licenses` | Issue a key for `userId` after payment approval; raw key returned once | Current database admin role |
| POST | `/api/admin/licenses/:id/revoke` | Revoke a license | Current database admin role |

Keep raw license keys private. Deliver them to the correct customer after payment verification. They are not download tokens or website login tokens.

Issuance accepts `{ "userId": "customer-id" }`. The server generates the key, commits its SHA-256 hash to Supabase `qbot_licenses.key_hash` with the customer's `user_id`, and then returns HTTP 201 with `{ licenseKey, license, message }` and `Cache-Control: no-store`. The customer's name and email live in the referenced `qbot_users` row. Database failure returns HTTP 503 without a key. Neither raw keys nor hashes are returned by list/account endpoints; only this successful creation response contains the full key. No Firebase service is involved.

License summaries contain the masked prefix, raw lifecycle state (`issued`, `active`, `revoked`), key expiry and optional registered-PC metadata (`id`, `device_name`, `machine_hash`, `status`, `last_heartbeat_at`). Expiry is evaluated against the timestamp; an `active` database row is not proof of an unexpired subscription. A renewal payment extends the subscription, while an existing key keeps its own expiry until replacement activation.

`POST /api/admin/users/:id/grant-promo` accepts integer `days` from 1 through 365 and records an atomic promotional extension. Reactivation endpoints reject expired or future subscriptions without granting time. Unknown API paths return JSON 404; unavailable password-reset and 2FA routes return 501; retired payment simulation and browser-pairing routes return 410.
