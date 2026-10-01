# Website licensing audit — 30 September 2026

The current implementation is `website-licensing`. The sibling `algotraders.site` directory is a retired snapshot.

## Follow-up — 1 October 2026

License generation now uses the Supabase transaction as its only persistence requirement. The SHA-256 hash in `qbot_licenses.key_hash` is linked through `user_id` to the customer's name and email in `qbot_users`. The unfinished Firebase dependency and its required configuration were removed. Customer names and emails are shown in the selector, license table and once-only copy popup.

Current validation passed: website TypeScript, all 36 website/database/API tests, the production build and server-start smoke test, and 13 browser checks. Coverage includes customers sharing a name, committed hash ownership, failed writes without key disclosure, rollback of a failed replacement, duplicate generation clicks, clipboard failures, and clearing the key on Close, Escape and reload. Android TypeScript also passed. All 23 Python licensing tests passed across the sandbox run (22) and the separate Windows DPAPI test under the normal Windows account (1).

The popup screenshot and browser results in `.test-artifacts/website-license-audit/` use disposable fixtures. These checks did not issue a production key, migrate Supabase or verify private production settings. The deployment observations below are from the original 30 September audit.

## Deployment finding

The deployed licensing host, `https://algotraders-ena2.onrender.com`, still serves the older website. Read-only checks returned:

| Check | Observed result |
|---|---|
| `GET /api/health` | HTTP 200, version `2.4.1`, without the current licensing protocol marker |
| Unauthenticated `GET /api/admin/licenses` | HTTP 200 with website HTML; the current API should return JSON with HTTP 401 |
| Public frontend bundle | No current license-generation control labels |

Therefore the local implementation must be deployed before the installed client's current licensing flow can work against that host. This audit did not deploy the website, migrate the production database, approve real payments, issue production keys, or change signing keys. The custom domain `https://algotraders.site` failed DNS resolution (`ENOTFOUND`) from this environment; its DNS/routing still needs verification.

## Functionality reviewed and corrected

| Feature | Local result |
|---|---|
| Registration and login | Registration remains inactive; real login tokens and the current database role protect administration |
| Manual payment | Server determines the plan amount; approval credits 30 or 365 days exactly once; unregistered payment email is rejected without partial approval |
| Admin key controls | Approval selects the customer in **Customer license keys**; **Generate license key**, **Copy key**, **Refresh licenses**, and **Revoke** are available; verified payment/customer rows include **License keys** shortcuts |
| Eligibility | Unpaid, expired, future and suspended subscriptions cannot generate keys; the server enforces this independently of disabled buttons |
| Key confidentiality | Random `QB2-...` keys are displayed once and stored as SHA-256 hashes; lists expose only the prefix; reload does not recover a raw key |
| Correct recipient | A generated key retains its customer's email even if the selected customer changes; a later list failure does not discard the once-only key |
| Windows activation | Signed Ed25519 challenge proof binds the device ID, machine hash and device key; another PC, copied device ID, forged signature and reused/expired challenge are rejected |
| JWT authorization | RS256 lease binds customer, subscription and PC; maximum 900 seconds, never beyond the earlier of subscription and key expiry |
| Renewal | Approved time does not silently extend the old key; activating the replacement revokes the old activation; the dashboard displays the two expiries separately |
| PC replacement | The seller can issue a replacement key; activation leaves one Windows PC authorized |
| Revocation | License revocation works; device removal now atomically revokes the device and its bound keys using the same customer lock as refresh |
| Promotional time | Explicit admin grants are bounded to 1–365 integer days and applied atomically; reactivation no longer silently grants an expired account another 30 days |
| Subscription display | Timestamp expiry, future periods and suspension are reflected in customer/admin status and the navigation badge |
| Admin visibility | Correct metric fields and real zero values replace placeholders; activity log shows actual payment/license events; PC ID, hashed fingerprint and validation time are available |
| Admin errors and notes | API failures are displayed as failures; support notes send the field expected by the backend and keep the form open on error |
| Renewing payment form | Reopening the form clears the prior success state and UTR and generates a fresh receipt reference |
| Downloads | Active paid access, configured licensed artifacts and checksum verification remain required; no legacy/unprotected fallback |
| Database handling | The active service uses persistent Supabase; obsolete MySQL polling/export controls and embedded legacy connection defaults were removed |
| Documentation and plan text | Both plans describe one Windows PC with an Android companion, manual prepaid renewal, and a maximum 15-minute lease |

## Verification

- `npm run lint`: passed.
- `npm test`: 33 tests passed, none skipped. Includes PostgreSQL migration/RPC tests, authenticated HTTP administration, payment approval through the full website API, download enforcement, status boundaries and a real Python client activating/restarting/renewing over HTTP.
- `npm run build`: production frontend and Node server built successfully.
- `node tests/production-start.mjs`: built server starts with disposable signing keys, serves the frontend, rejects anonymous license administration and returns JSON 404 for unknown API paths.
- `npm run test:ui`: 10 browser checks passed using the production frontend, an isolated Chrome profile and disposable API fixtures. Covers approval → generation → copying, once-only keys, failed refresh, recipient selection, support-note failures, revocation, customer expiry/renewal, repeat payment submission and blocked customer access to admin controls.
- Existing Python licensing tests: 22 passed in the sandbox; the Windows DPAPI storage test passed separately under the normal Windows account with a fresh workspace temporary directory. No Windows client source changes were needed.
- Local website/Windows public verification keys match the existing 3072-bit RSA private signing key and saved server signing configuration. No private key was printed or regenerated.
- Frontend build contains no private signing key, server service-role setting or licensing private-key setting.

Browser evidence is saved in the top-level workspace at `.test-artifacts/website-license-audit/`. The screenshot and browser results use test accounts and a disposable key, not a real customer license.

## Remaining deployment and feature limits

Follow [DEPLOYMENT.md](DEPLOYMENT.md): back up the database; apply migrations 002 and 003 in order; provision/verify the admin; configure the existing signing key, a strong website JWT secret, server-only Supabase credentials and verified download URLs/checksums; deploy this project's built Node service.

The saved local server-settings template still has a placeholder Supabase service-role key. Production private settings and authenticated production operations were not verified. Keep the existing signing key when deploying so installed clients continue to trust the server.

Password recovery and two-factor enrollment remain unimplemented. Their endpoints explicitly return unavailable errors instead of pretending to reset a password or accept test codes. There is no automatic payment gateway/customer portal; renewals are manually paid and approved. Existing signed bot authorization can continue until its lease expires, at most 15 minutes, after revocation.
