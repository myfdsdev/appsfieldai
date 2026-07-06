# Custom Domain Service

A standalone Node/Express service for AppsfieldAI (a Base44-hosted store-builder
SaaS) that lets store owners map their own domain (e.g. `deals.yourbrand.com`)
to their store. It runs on **Render**, which handles ownership verification and
automatic SSL for each customer domain, then reverse-proxies the traffic to the
existing Base44 app.

The Base44 app itself is untouched — stores still render exactly as they do
today (client-side SPA, `getMarketplacePublic`, etc.). This service just sits in
front of arbitrary customer-owned domains and forwards each request to
`app.appsfieldai.com`.

## How it works

```
Customer's domain (deals.yourbrand.com)
      │  CNAME → PUBLIC_SERVICE_HOST (this service's *.onrender.com host)
      │  (apex domains use an A record → 216.24.57.1)
      ▼
   Render edge — verifies the domain and issues a TLS cert automatically
      ▼
   Node/Express (this service)
      1. Look up Host header in MongoDB → known mapping?
      2. Reverse-proxy to UPSTREAM_ORIGIN (https://app.appsfieldai.com)
      3. Rewrite <title>/canonical/OG tags in the HTML shell only
      ▼
   The same Base44 app — its existing client-side code
   (src/lib/storeHost.js) already detects the custom domain
   and renders the right store, no /store/{slug} prefix needed.
```

`app.appsfieldai.com` traffic never passes through this service — it resolves to
Base44 directly, as it always has. This service is only ever reached via a
customer domain that Render has verified and routed here.

## Why Render's API (not Caddy)

Render terminates TLS at its own edge, so a container can't run its own
on-demand TLS. Instead this service calls Render's custom-domains API to
register each customer domain on itself; Render then verifies ownership (by
checking the customer's DNS points at Render) and issues a Let's Encrypt cert
automatically. That means **customers add a single DNS record** and this service
reads verification status from Render — no separate TXT record, no Caddy.

> **Scale note:** Render caps custom domains per service (roughly 50 on standard
> plans). For large numbers of customer domains you'd move to Cloudflare for
> SaaS or a VPS + Caddy model instead.

## Endpoints

### Admin API (bearer auth, called from `DomainManager.jsx`)

All require `Authorization: Bearer <VERIFICATION_SECRET>`.

| Method | Path | Body | Purpose |
|---|---|---|---|
| POST | `/api/admin/domains` | `{ domain, storeSlug, marketplaceId, userId }` | Register the domain on Render, return the DNS record to add |
| GET | `/api/admin/domains/:domain` | — | Current status + DNS record |
| POST | `/api/admin/domains/:domain/verify` | `{ userId }` | Ask Render to (re)verify, read status back |
| DELETE | `/api/admin/domains/:domain` | `{ userId }` | Remove from Render and this DB |

The DNS record returned is a single object: `{ type, name, target }` — a
`CNAME` → `PUBLIC_SERVICE_HOST` for subdomains, or an `A` → `PUBLIC_SERVICE_IP`
for apex/root domains.

### Public endpoint (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/domain-for-store?slug=X` | `{ customDomain, redirectEnabled }` — used by `StorePage.jsx` to redirect `app.appsfieldai.com/store/{slug}` to the custom domain |

## Setup (local)

```bash
cd custom-domain-service
npm install
cp .env.example .env   # then edit .env
npm start              # or: npm run dev  (node --watch)
```

Requires **Node 18+**. Domain mappings are stored in **MongoDB** (collection
`domain_mappings`); the service creates its indexes on startup.

### Environment variables

| Var | Purpose |
|-----|---------|
| `PORT` | Node port (Render sets this automatically; `4000` for local dev). |
| `VERIFICATION_SECRET` | Shared bearer token the Base44 frontend must send for admin calls. |
| `MONGODB_URI` | MongoDB connection string (e.g. an Atlas `mongodb+srv://...` URI). |
| `MONGODB_DB` | Database name (default `appsfieldai`). |
| `MONGODB_COLLECTION` | Collection name (default `domain_mappings`). |
| `UPSTREAM_ORIGIN` | The live Base44 app to proxy custom-domain traffic to (`https://app.appsfieldai.com`). |
| `BASE44_FUNCTIONS_ORIGIN` | Base44 app host used to call `getMarketplacePublic` for SEO tag rewriting. |
| `RENDER_API_KEY` | Render API key (dashboard → Account Settings → API Keys). |
| `RENDER_SERVICE_ID` | The `srv-xxxx` id of this Render service. |
| `PUBLIC_SERVICE_HOST` | This service's own `*.onrender.com` host — the CNAME target for subdomain custom domains. |
| `PUBLIC_SERVICE_IP` | Render's shared apex A-record IP (`216.24.57.1`). |
| `CORS_ORIGIN` | Optional — lock CORS to one origin instead of `*`. |

The main Base44 app also needs two Vite env vars (`.env` at the repo root) to
call this service:

```
VITE_DOMAIN_SERVICE_URL=https://<this-service>.onrender.com
VITE_DOMAIN_SERVICE_SECRET=<same value as VERIFICATION_SECRET>
```

Note `VITE_`-prefixed vars are bundled into client-side JS and visible to anyone
inspecting the app — this matches how the shared bearer secret was always
intended to be used here (called directly from the browser).

## Deploy to Render

1. **Push this repo to GitHub** (the service lives in `custom-domain-service/`).
2. In Render, **New → Web Service** from the repo. Set **Root Directory** to
   `custom-domain-service`, Build `npm ci`, Start `node server.js`. (Or use the
   included `render.yaml` via **New → Blueprint**.) Pick a **paid instance type**
   — custom domains aren't available on the free tier.
3. After the first deploy, note two things from the service's dashboard:
   - its public URL, e.g. `custom-domain-service-xxxx.onrender.com`
   - its service id from the URL, e.g. `srv-abc123...`
4. Create a **Render API key** (Account Settings → API Keys).
5. Set the service's **environment variables** (from the table above), including
   `RENDER_API_KEY`, `RENDER_SERVICE_ID`, and `PUBLIC_SERVICE_HOST` (the
   onrender.com host from step 3). Redeploy.
6. In the **main Base44 app**, set `VITE_DOMAIN_SERVICE_URL` (the onrender URL)
   and `VITE_DOMAIN_SERVICE_SECRET` (= `VERIFICATION_SECRET`), then republish.

### Customer flow

1. Owner enters their domain in the app's Custom Domain page and clicks Connect.
2. This service registers it on Render and shows the one DNS record to add.
3. Owner adds that record at their DNS provider (CNAME → the onrender host, or
   A → `216.24.57.1` for a root domain).
4. Owner clicks Verify. Once Render confirms the DNS, it issues the SSL cert and
   the store goes live on the custom domain automatically.

## curl examples

```bash
BASE=https://custom-domain-service-xxxx.onrender.com

# Connect a domain (returns the DNS record to add)
curl -X POST $BASE/api/admin/domains \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "domain": "deals.yourbrand.com", "storeSlug": "my-test-saas", "marketplaceId": "mp1", "userId": "user1" }'

# Verify
curl -X POST $BASE/api/admin/domains/deals.yourbrand.com/verify \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "user1" }'

# Public lookup (used by StorePage.jsx's redirect check)
curl "$BASE/api/domain-for-store?slug=my-test-saas"
```

## Base44 fields this service reads/writes

It does **not** call any generic Base44 entities REST API (none exists for
external callers) — the only Base44 dependency is calling the existing public
`getMarketplacePublic` function over HTTP for SEO tag data. Domain mapping and
verification state live entirely in this service's own MongoDB collection.

The main app's `Marketplace.customDomain` field is still kept in sync from
`DomainManager.jsx` (since `getMarketplacePublic` resolves stores by that field
for the SPA's own client-side custom-domain detection) — but
`verificationToken`/`verificationStatus`/`sslStatus`/`connectedAt` on that entity
are no longer read or written; this service is now the source of truth for those.
