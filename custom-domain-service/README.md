# Custom Domain Service

A standalone Node/Express + Caddy service for AppsfieldAI (a Base44-hosted
store-builder SaaS) that lets store owners map their own domain (e.g.
`deals.yourbrand.com`) to their store, with TXT-record ownership verification,
automatic SSL, and reverse-proxying to the existing Base44 app.

The Base44 app itself is untouched — stores still render exactly as they do
today (client-side SPA, `getMarketplacePublic`, etc.). This service just sits
in front of arbitrary customer-owned domains, confirms ownership, terminates
TLS, and forwards the request to `app.appsfieldai.com`.

## How it works

```
Customer's domain (deals.yourbrand.com)
      │  CNAME/A → PUBLIC_SERVICE_HOST (this service)
      ▼
   Caddy (80/443) — on-demand TLS, gated by /api/ask
      ▼
   Node/Express (port 4000, internal)
      1. Look up Host header in local SQLite → verified + active?
      2. Reverse-proxy to UPSTREAM_ORIGIN (https://app.appsfieldai.com)
      3. Rewrite <title>/canonical/OG tags in the HTML shell only
      ▼
   The same Base44 app — its existing client-side code
   (src/lib/storeHost.js) already detects the custom domain
   and renders the right store, no /store/{slug} prefix needed.
```

`app.appsfieldai.com` traffic never passes through this service — it resolves
to Base44 directly, as it always has. This service is only ever reached via a
verified customer domain.

## Endpoints

### Admin API (bearer auth, called from `DomainManager.jsx`)

All require `Authorization: Bearer <VERIFICATION_SECRET>`.

| Method | Path | Body | Purpose |
|---|---|---|---|
| POST | `/api/admin/domains` | `{ domain, storeSlug, marketplaceId, userId }` | Connect a domain, get DNS instructions |
| GET | `/api/admin/domains/:domain` | — | Current status + DNS instructions |
| POST | `/api/admin/domains/:domain/verify` | `{ userId }` | Re-check DNS, flip status |
| DELETE | `/api/admin/domains/:domain` | `{ userId }` | Remove the mapping |

### Public endpoints (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/domain-for-store?slug=X` | `{ customDomain, redirectEnabled }` — used by `StorePage.jsx` to redirect `app.appsfieldai.com/store/{slug}` to the custom domain |
| GET | `/api/ask?domain=X` | Caddy's on-demand TLS callback — `200` if verified+active, else `403` |

### Verification logic

Same TXT + CNAME/A check pattern as the original Base44 `verifyCustomDomain`
function, resolved via Cloudflare DNS-over-HTTPS (`lib/dnsQuery.js`):

- **TXT**: `_<TXT_KEY>-verify.<domain>` must contain `<TXT_KEY>-verify=<token>`.
- **CNAME** (subdomain domains) or **A** (apex/root domains): must equal
  `PUBLIC_SERVICE_HOST` / `PUBLIC_SERVICE_IP` — i.e. point at *this* service,
  not directly at Base44.

Message wording on verify:

| Situation | Message |
|-----------|---------|
| Both missing | `Neither the TXT nor CNAME record was found yet. DNS can take up to 48h to propagate.` |
| Only TXT missing | `CNAME found, but the TXT verification record is missing or incorrect.` |
| Only CNAME missing | `TXT record verified, but the CNAME record is missing or incorrect.` |
| Verified | `Domain verified and SSL activated.` |

## Setup

```bash
cd custom-domain-service
npm install
cp .env.example .env   # then edit .env
npm start              # or: npm run dev  (node --watch)
```

Requires **Node 22.5+** — domain mappings are stored via Node's built-in
`node:sqlite` module (no native compilation needed, unlike `better-sqlite3`).

### Environment variables

| Var | Purpose |
|-----|---------|
| `PORT` | Internal Node port (default `4000`). Caddy is the public entry point. |
| `VERIFICATION_SECRET` | Shared bearer token the Base44 frontend must send for admin calls. |
| `UPSTREAM_ORIGIN` | The live Base44 app to proxy verified custom-domain traffic to (`https://app.appsfieldai.com`). Must be a normal HTTPS origin — do not point this at `base44.onrender.com` directly, Cloudflare blocks mismatched Host/SNI requests as domain fronting. |
| `BASE44_FUNCTIONS_ORIGIN` | Base44 app host used to call `getMarketplacePublic` for SEO tag rewriting. |
| `PUBLIC_SERVICE_HOST` | This service's own public hostname — the CNAME target for subdomain custom domains. |
| `PUBLIC_SERVICE_IP` | This service's own public static IP — the A-record target for apex/root custom domains. |
| `SQLITE_PATH` | Path to the domain-mappings SQLite file. |
| `CORS_ORIGIN` | Optional — lock CORS to one origin instead of `*`. |

The main Base44 app also needs two Vite env vars (`.env` at the repo root) to
call this service:

```
VITE_DOMAIN_SERVICE_URL=https://connect.appsfieldai.com
VITE_DOMAIN_SERVICE_SECRET=<same value as VERIFICATION_SECRET>
```

Note `VITE_`-prefixed vars are bundled into client-side JS and visible to
anyone inspecting the app — this matches how the shared bearer secret was
always intended to be used here (called directly from the browser), not a
new limitation introduced by this service.

## curl examples

```bash
# Connect a domain (returns DNS instructions)
curl -X POST https://connect.appsfieldai.com/api/admin/domains \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "domain": "deals.yourbrand.com", "storeSlug": "my-test-saas", "marketplaceId": "mp1", "userId": "user1" }'

# Verify DNS
curl -X POST https://connect.appsfieldai.com/api/admin/domains/deals.yourbrand.com/verify \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "user1" }'

# Public lookup (used by StorePage.jsx's redirect check)
curl "https://connect.appsfieldai.com/api/domain-for-store?slug=my-test-saas"
```

## Base44 fields this service reads/writes

It does **not** call any generic Base44 entities REST API (none exists for
external callers) — the only Base44 dependency is calling the existing public
`getMarketplacePublic` function over HTTP for SEO tag data. Domain mapping and
verification state live entirely in this service's own SQLite database.

The main app's `Marketplace.customDomain` field is still kept in sync from
`DomainManager.jsx` (since `getMarketplacePublic` resolves stores by that
field for the SPA's own client-side custom-domain detection) — but
`verificationToken`/`verificationStatus`/`sslStatus`/`connectedAt` on that
entity are no longer read or written; this service is now the source of truth
for those.

## Deploy

**Use a VPS or Fly.io, not Railway/Render.** Caddy's on-demand TLS needs
direct control of ports 80/443 and persistent certificate storage — typical
PaaS platforms terminate TLS at their own edge and don't support issuing
certs for arbitrary customer-supplied hostnames this way.

```bash
docker build -t custom-domain-service .
docker run -d -p 80:80 -p 443:443 \
  --env-file .env \
  -v $(pwd)/data:/data \
  custom-domain-service
```

Point your customer domains' CNAME/A records at wherever this container is
publicly reachable (`PUBLIC_SERVICE_HOST` / `PUBLIC_SERVICE_IP`).

## Local testing without real DNS/TLS

```bash
# Simulate a verified custom domain hitting the proxy directly (no Caddy needed)
curl -H "Host: deals.yourbrand.com" http://localhost:4000/
```

A full on-demand TLS handshake can't be faked locally — Let's Encrypt requires
genuine public reachability. Test that part with a real cheap test domain +
ngrok/Cloudflare Tunnel pointed at a deployed instance.
