# Domain Verification Backend

A standalone Node.js/Express microservice that handles custom-domain verification
for a Base44 marketplace app. The app itself stays on Base44 — this backend only
exposes two endpoints that the Base44 frontend calls via `fetch()` instead of
Base44 functions.

## Endpoints

### `GET /api/platform-domain` (public, no auth)

Returns the configured platform domain and the CNAME target every custom domain
must point at.

- Reads `platformDomain` from the Base44 `AppConfig` entity (key `"main"`).
- Falls back to the `PLATFORM_DOMAIN` env var when not configured.
- `cnameTarget` is the fixed `CNAME_TARGET` env var.

Response:

```json
{
  "platformDomain": "yourdomain.com",
  "cnameTarget": "base44.onrender.com",
  "source": "configured"
}
```

`source` is `"configured"` (came from AppConfig) or `"default"` (came from the env var).

### `POST /api/verify-custom-domain` (Bearer auth)

Verifies a marketplace's custom domain against its DNS records and writes the
result back to Base44.

- **Auth:** `Authorization: Bearer <VERIFICATION_SECRET>`. Missing/wrong → `401`.
- **Body:** `{ "marketplaceId": "<id>" }`. Optionally include `"userId": "<id>"`
  (or send an `X-User-Id` header) to enforce ownership — if present and it does
  not match `marketplace.ownerId`, the request returns `403`.
- Returns `404` if the marketplace is not found, `400` if the marketplace has no
  custom domain or no verification token.

What it checks:

1. **TXT record** at `_<txtKey>-verify.<customDomain>` (where
   `txtKey = platformDomain.split(".")[0]`). Matches if any value contains
   `<txtKey>-verify=<verificationToken>`.
2. **CNAME record** on `<customDomain>`. Matches if any value equals
   `<subdomain|slug|"store">.<platformDomain>`.

Both are resolved via Cloudflare DNS-over-HTTPS. `verified = txtMatch && cnameMatch`.

On completion it PATCHes the Marketplace:

- `verificationStatus`: `"verified"` or `"failed"`
- `sslStatus`: `"active"` or `"pending"`
- `connectedAt`: set to the current ISO timestamp when verified

Response:

```json
{
  "verified": false,
  "checks": {
    "txt": { "name": "_yourdomain-verify.deals.clientbrand.com", "found": false, "records": [] },
    "cname": { "name": "deals.clientbrand.com", "found": false, "target": "mystore.yourdomain.com", "records": [] }
  },
  "message": "Neither the TXT nor CNAME record was found yet. DNS can take up to 48h to propagate."
}
```

Message wording:

| Situation | Message |
|-----------|---------|
| Both missing | `Neither the TXT nor CNAME record was found yet. DNS can take up to 48h to propagate.` |
| Only TXT missing | `CNAME found, but the TXT verification record is missing or incorrect.` |
| Only CNAME missing | `TXT record verified, but the CNAME record is missing or incorrect.` |
| Verified | `Domain verified and SSL activated.` |

## Setup

```bash
git clone <your-repo>
cd domain-verification-backend
npm install
cp .env.example .env   # then edit .env
npm start              # or: npm run dev  (node --watch)
```

### Environment variables

| Var | Purpose |
|-----|---------|
| `PORT` | HTTP port (default `3000`). |
| `NODE_ENV` | `development` / `production`. |
| `VERIFICATION_SECRET` | Shared bearer token the frontend must send. |
| `CNAME_TARGET` | The real host Base44 serves the app on, e.g. `base44.onrender.com`. |
| `PLATFORM_DOMAIN` | Fallback platform domain if AppConfig has none. |
| `BASE44_API_KEY` | Base44 service API key (`base44_sk_...`). |
| `BASE44_API_URL` | Base44 REST base URL (default `https://api.base44.com`). |
| `CORS_ORIGIN` | Optional — lock CORS to one origin instead of `*`. |

## curl examples

```bash
# Public — get platform domain
curl https://your-backend-url.com/api/platform-domain

# Verify a custom domain (shared secret)
curl -X POST https://your-backend-url.com/api/verify-custom-domain \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "marketplaceId": "abc123" }'

# Verify with ownership enforcement
curl -X POST https://your-backend-url.com/api/verify-custom-domain \
  -H "Authorization: Bearer YOUR_VERIFICATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "marketplaceId": "abc123", "userId": "user_456" }'
```

## Base44 entity structure

**`Marketplace`** must have these fields (all already present in this app's schema):

| Field | Type | Used for |
|-------|------|----------|
| `ownerId` | string | Ownership check (`403`). |
| `slug` | string | CNAME target fallback. |
| `subdomain` | string | Preferred CNAME target label. |
| `customDomain` | string | The domain being verified. |
| `verificationToken` | string | Expected TXT token. |
| `verificationStatus` | enum `pending\|in_progress\|verified\|failed` | Written on completion. |
| `sslStatus` | enum `pending\|active\|failed` | Written on completion. |
| `connectedAt` | date-time | Set when verified. |

**`AppConfig`** row with `key: "main"` may set `platformDomain` (e.g. `saasshare.app`).

## Deploy (Railway / Render)

1. Push this folder to a Git repo (or point the host at this subdirectory).
2. Create a new **Node** web service.
   - Build command: `npm install`
   - Start command: `npm start`
3. Set the environment variables from the table above in the host dashboard.
4. Note the public URL the host gives you.

### Wire up the Base44 frontend

In `DomainManager.jsx`, replace the Base44 function calls:

```js
// Before
base44.functions.invoke("getPlatformDomain", {});
base44.functions.invoke("verifyCustomDomain", { marketplaceId });

// After
fetch("https://your-backend-url.com/api/platform-domain")
  .then((r) => r.json());

fetch("https://your-backend-url.com/api/verify-custom-domain", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_VERIFICATION_SECRET",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ marketplaceId }),
}).then((r) => r.json());
```
