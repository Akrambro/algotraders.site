# Licensed QBot2 deployment

Deploy the `website-licensing` project for the seller-issued key flow. The separate `algotraders.site` directory is a retired website snapshot.

## Server and database

1. Configure a Node.js 22 host using `render.yaml` or equivalent. Copy the required names from `.env.example` into the host's private environment settings.
2. Back up the Supabase PostgreSQL database. Apply `migrations/002_device_licensing.sql`, then `migrations/003_license_admin_workflow.sql`. If 002 is already installed, apply 003 to update device revocation and promotional extensions. Both migrations are repeatable and preserve existing keys and paid periods. The admin portal's **Download licensing SQL** button includes both files. Historical tables remain in place; reconcile any older payment queue before switching the live service.
3. Configure `SUPABASE_URL`, server-only `SUPABASE_SERVICE_ROLE_KEY`, a unique `JWT_SECRET`, and `LICENSE_PRIVATE_KEY_B64`. Generate signing keys once with `npm run license:keys` if none have been provisioned. Preserve an existing key pair when updating an installed release.
4. Provision the administrator with `npm run admin:setup -- email@example.com path-to-private-password-file`. Keep that password file private.
5. Run `npm run lint`, `npm test`, `npm run build`, then `npm start`. The Node server serves both the frontend and authenticated API. Uploading raw source through FTP does not deploy this service. Optional browser checks: run `npm run test:ui` after building, with Chrome or Edge installed (or set `QBOT_TEST_BROWSER` to its executable).
6. Run `npm run check:deployment` against Render, or `npm run check:deployment -- https://your-domain.example`. This makes read-only requests to health, the admin-license endpoint and the public frontend bundle. Confirm the health response identifies `seller-issued-device-bound-v1`; an unauthenticated `/api/admin/licenses` request must return JSON with HTTP 401, not the SPA HTML. These probes do not verify private database credentials or issue a real key.

Customers register without a trial entitlement. The administrator verifies manual payments and issues private `QB2-...` license keys. Windows builds embed only the matching public verification key; Android activates the connected Windows PC.

## Administrator workflow

1. Open `/#admin` and sign in with the provisioned administrator account.
2. Check the customer's UTR against the payment actually received. The customer must register using the payment email before approval.
3. Select **Approve payment** in the payment queue. Approval adds 30 days for monthly or 365 days for annual, starting from the later of the existing paid expiry and now. Repeating approval for the same payment does not add time again.
4. Approval selects that customer in **Customer license keys**. Select **Generate license key** to open a popup with the customer's name, email and expiry. Select **Copy key**, then deliver it privately. **Close and hide key** (or Escape) clears the full key; refresh and sign-in cannot retrieve it. If clipboard access is unavailable, select and copy the text manually before closing. The **License keys** buttons on verified payments and customer rows reopen these controls.
5. Confirm the customer activates the key on Windows or through Android connected to that PC. The portal then shows the registered device ID, hashed machine fingerprint, key expiry and latest validation time. Payment approval alone does not activate the installed bot.

Generation saves the SHA-256 hash in Supabase `public.qbot_licenses.key_hash` before returning the full key to the popup. `user_id` references `public.qbot_users.id`, which holds the customer's name and email; customers with the same name remain separate. Supabase stores the hash and masked prefix, never the full key. A failed save returns an error without releasing a key. No Firebase configuration is required.

To inspect ownership in the private Supabase SQL editor:

```sql
SELECT u.id AS customer_id, u.name AS customer_name, u.email,
       l.id AS license_id, l.key_hash, l.key_prefix, l.status, l.expires_at
FROM public.qbot_licenses AS l
JOIN public.qbot_users AS u ON u.id = l.user_id
ORDER BY l.issued_at DESC;
```

For renewal, approve the new payment and generate a new key. The old key keeps its original expiry until the customer enters the new one. For a replacement PC, generate a replacement key; activating it revokes the previous PC. Generating again invalidates an unused key, while an already activated key continues until replacement activation, revocation or expiry.

**Revoke** stops future lease renewal. Existing signed authorization lasts at most 15 minutes and never beyond paid expiry. Device removal also revokes the bound key. **Activate Sub** only restores an unexpired subscription; **+30 Days** is an explicit promotional grant and requires a new key to extend the PC's expiry.

The customer dashboard shows subscription and PC-key status separately, including when a renewal key still needs to be entered. Password recovery and two-factor enrollment are not implemented; their API routes explicitly report unavailability. Manual prepaid billing has no automatic renewal charge or gateway customer portal.

## Release settings

Build and test new clients using the [release guide](../../packaging/README.md). Configure these only for the final licensed artifacts:

```dotenv
LICENSED_WINDOWS_DOWNLOAD_URL=
LICENSED_WINDOWS_DOWNLOAD_SHA256=
LICENSED_ANDROID_DOWNLOAD_URL=
LICENSED_ANDROID_DOWNLOAD_SHA256=
LICENSED_WINDOWS_DOWNLOAD_SIZE=
LICENSED_ANDROID_DOWNLOAD_SIZE=
```

URLs must use HTTPS and each artifact needs its full SHA-256. Legacy `APP_DOWNLOAD_*` and `APK_DOWNLOAD_*` settings are ignored. The API exposes authenticated same-site download routes, not the storage URLs. Missing or invalid configuration disables that release.

File requests require a signed-in customer and an active subscription whose paid period has started and has not expired. The server stages each file in temporary storage, verifies its checksum, rechecks entitlement and sends it as an attachment. Reserve temporary disk capacity for concurrent downloads; each file is limited to 1 GiB and its upstream transfer to two minutes. Unavailable storage, partial transfers and checksum mismatches return an error without a redirect or legacy fallback.

## Retire the unprotected releases

Remove previous ZIPs/APKs from public storage, revoke their shared links, remove `latest` aliases and purge CDN caches. Remove legacy download settings from the host. Confirm the old public URLs no longer serve files, then verify the dashboard's new Windows and Android downloads and activation flow.

Deploying the licensing server does not protect old binaries or copies customers already have. This source change does not itself delete hosted artifacts, purge a CDN or deploy the website.
