# AlgoTraders license portal

The admin portal at `/#admin` approves customer payments and generates device-bound QBot2 license keys. Generation commits a SHA-256 hash to Supabase `qbot_licenses`, linked by `user_id` to the customer's name and email in `qbot_users`. The full key is returned once in a popup with **Copy key** and **Close and hide key** controls. A database failure does not release a key.

Use Node.js 22 and follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) to configure Supabase, apply migrations 002 and 003, preserve the server signing key, and provision an administrator. All server secrets belong in private environment settings. The browser receives neither the Supabase service-role key nor the license signing key.

```sh
npm ci --legacy-peer-deps
npm run lint
npm test
npm run build
npm start
```

For the Python interoperability test, set `QBOT_TEST_CLIENT_ROOT` to a checkout of `Akrambro/QuotexBot_saleversion` (or use this project as its `website-licensing` submodule). Set `QBOT_TEST_PYTHON` if the Python dependencies are installed in a virtual environment. After building, `npm run test:ui` checks the admin/customer flows using disposable fixtures and Chrome or Edge; `QBOT_TEST_BROWSER` can specify the browser executable.

The public website's GitHub workflow sets `QBOT_TEST_SKIP_CLIENT_INTEROP=1` and runs the 35 independent website tests. The private bot repository's **Validate client licensing** workflow runs all 36 tests against the website commit pinned in its submodule, including the real Python client. No cross-repository secret is needed.

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for activation, renewal, downloads and administration, and [LICENSE_AUDIT.md](docs/LICENSE_AUDIT.md) for validation details. Pushes run GitHub validation; deploy the built Node service on Render to update the live portal.
