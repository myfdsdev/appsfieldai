# Custom Domain Service

A standalone Node/Express service for AppsfieldAI (a Base44-hosted store-builder
SaaS) that lets store owners map their own domain (e.g. `deals.yourbrand.com`)
to their store. It uses **Cloudflare for SaaS** (Custom Hostnames) for unlimited
customer domains + automatic SSL, runs on **Fly.io**, and reverse-proxies the
traffic to the existing Base44 app.

The Base44 app itself is untouched — stores still render exactly as they do
today (client-side SPA, `getMarketplacePublic`, etc.). This service registers
each customer domain with Cloudflare and forwards its requests to
`app.appsfieldai.com`.

## How it works

```
Customer domain (deals.yourbrand.com)
   │  CNAME → CF_CNAME_TARGET (e.g. custom.appsfieldai.com, in your CF zone)
   ▼
Cloudflare edge — Custom Hostname: verifies ownership + issues/renews the TLS cert,
   │  forwards with the original Host preserved to the zone's Fallback Origin
   ▼
Fallback origin (a proxied DNS record in appsfieldai.com → this Fly.io app)
   ▼
Node/Express on Fly.io
   1. Look up Host header in MongoDB → known mapping?
   2. Reverse-proxy to UPSTREAM_ORIGIN (https://app.appsfieldai.com)
   3. Rewrite <title>/canonical/OG tags in the HTML shell only
   ▼
The same Base44 app — its client-side code (src/lib/storeHost.js) detects the
custom domain and renders the right store, no /store/{slug} prefix needed.
```

`app.appsfieldai.com` traffic never passes through this service. This service is
only reached via a customer domain that Cloudflare has validated and routed here.

## Why Cloudflare + Fly (not Render)

Render's custom-domains API is capped (~25–50 per service) — too few for a
multi-tenant store builder. Cloudflare for SaaS scales to thousands of hostnames
and manages every cert. But Cloudflare forwards the *customer's* hostname as the
`Host` header, and Render (behind Cloudflare's own edge) **rejects unknown Hosts
with a 403**. Fly.io accepts any Host header, so it can serve as Cloudflare's
fallback origin.

## Endpoints

### Admin API (bearer auth, called from `DomainManager.jsx`)

All require `Authorization: Bearer <VERIFICATION_SECRET>`.

| Method | Path | Body | Purpose |
|---|---|---|---|
| POST | `/api/admin/domains` | `{ domain, storeSlug, marketplaceId, userId }` | Register the domain on Cloudflare, return the DNS record(s) to add |
| GET | `/api/admin/domains/:domain` | — | Current status + DNS records (refreshed from Cloudflare) |
| POST | `/api/admin/domains/:domain/verify` | `{ userId }` | Read Cloudflare status; mark verified when the cert is active |
| DELETE | `/api/admin/domains/:domain` | `{ userId }` | Remove from Cloudflare and this DB |

DNS records are returned as `dns.records: [{ type, name, value, purpose }]` — a
routing `CNAME` (→ `CF_CNAME_TARGET`), plus any ownership/SSL records Cloudflare
still requires (usually none with HTTP DCV — just the CNAME).

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
| `PORT` | Node port (Fly sets `8080`; `4000` for local dev). |
| `VERIFICATION_SECRET` | Shared bearer token the Base44 frontend must send for admin calls. |
| `MONGODB_URI` / `MONGODB_DB` / `MONGODB_COLLECTION` | MongoDB connection + names. |
| `UPSTREAM_ORIGIN` | The live Base44 app to proxy custom-domain traffic to (`https://app.appsfieldai.com`). |
| `BASE44_FUNCTIONS_ORIGIN` | Base44 host used to call `getMarketplacePublic` for SEO tags. |
| `CLOUDFLARE_API_TOKEN` | Token scoped to the `appsfieldai.com` zone: `SSL and Certificates: Edit` + `Zone: Read`. |
| `CLOUDFLARE_ZONE_ID` | The `appsfieldai.com` zone id (Cloudflare dashboard → Overview). |
| `CF_CNAME_TARGET` | The CNAME value customers point at (the fallback-origin hostname, e.g. `custom.appsfieldai.com`). |
| `CORS_ORIGIN` | Optional — lock CORS to one origin instead of `*`. |

The main Base44 app also needs (root `.env`, or hardcoded fallbacks in
`DomainManager.jsx` / `StorePage.jsx`):

```
VITE_DOMAIN_SERVICE_URL=https://<this-fly-app>.fly.dev
VITE_DOMAIN_SERVICE_SECRET=<same value as VERIFICATION_SECRET>
```

## One-time Cloudflare setup (appsfieldai.com zone)

1. **Enable Cloudflare for SaaS** (dashboard → SSL/TLS → Custom Hostnames; paid add-on).
2. **Fallback origin:** create a **proxied** DNS record, e.g. `custom.appsfieldai.com`,
   pointing at this Fly app (A → Fly IP, or CNAME → `<app>.fly.dev`). Designate it as
   the **Fallback Origin** in Custom Hostnames settings. This host is `CF_CNAME_TARGET`.
3. **API token:** create one scoped to the zone with `SSL and Certificates: Edit` +
   `Zone: Read`. Note the token and the **Zone ID** (Overview page).

## Deploy to Fly.io

```bash
cd custom-domain-service
fly launch --no-deploy        # creates the app (rename in fly.toml if the name is taken)
fly secrets set \
  MONGODB_URI="..." \
  VERIFICATION_SECRET="..." \
  UPSTREAM_ORIGIN="https://app.appsfieldai.com" \
  BASE44_FUNCTIONS_ORIGIN="https://share-saas-hq.base44.app" \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  CF_CNAME_TARGET="custom.appsfieldai.com"
fly deploy
```

Then point the Cloudflare fallback-origin record (step 2) at the Fly app, and set
`VITE_DOMAIN_SERVICE_URL` in the Base44 app to the Fly app URL.

### Customer flow

1. Owner enters their domain in the app's Custom Domain page → Connect.
2. This service registers it on Cloudflare and shows the DNS record(s) to add.
3. Owner adds the CNAME (→ `CF_CNAME_TARGET`) at their DNS provider.
4. Owner clicks Verify. Once Cloudflare validates and the cert is active, the
   store goes live on the custom domain automatically.

## curl examples

```bash
BASE=https://<this-fly-app>.fly.dev

curl -X POST $BASE/api/admin/domains \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "domain": "deals.yourbrand.com", "storeSlug": "my-test-saas", "userId": "user1" }'

curl -X POST $BASE/api/admin/domains/deals.yourbrand.com/verify \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "user1" }'

curl "$BASE/api/domain-for-store?slug=my-test-saas"
```

## Notes

- **Apex domains** (`brand.com`): Cloudflare for SaaS needs CNAME-flattening/ALIAS
  at the apex; a pure A-record apex is an edge case. Subdomains (`deals.brand.com`)
  are a clean single CNAME.
- **Shared bearer secret** is embedded in client-side JS (inherent to calling this
  service from the browser). A future hardening step is to proxy admin calls through
  a Base44 function that uses the logged-in user's session.
- The only Base44 dependency is calling the public `getMarketplacePublic` function
  over HTTP for SEO data; domain/verification state lives entirely in this service's
  own MongoDB collection.
