# custom-domain-worker

Multi-tenant custom domains for **AppsfieldAI** using **Cloudflare for SaaS +
Worker + KV**, with a single **Render/Base44 origin**. Every customer domain is a
Cloudflare **Custom Hostname** — **never** added to Render. Cloudflare handles
SSL; the Worker identifies the tenant by hostname and proxies to the origin.

```
Visitor → https://shop.customerdomain.com
  DNS:      shop.customerdomain.com  CNAME  custom.appsfieldai.com
  Cloudflare: validates custom hostname, terminates SSL, runs the `*/*` Worker
  Worker:   hostname → KV lookup → tenant → add tenant headers → proxy to origin
  Origin:   verifies x-appsfield-proxy-secret, reads x-tenant-id, serves storefront
  Visitor:  still sees shop.customerdomain.com
```

## Code structure

```
src/
  index.js                            # fetch handler + route detection
  routes/domainApi.js                 # register / status / delete / domain-for-store
  services/
    cloudflareCustomHostnames.js      # Cloudflare Custom Hostnames API
    domainStore.js                    # KV read/write helpers
    proxy.js                          # origin selection + proxyToOrigin
  utils/
    validation.js                     # hostname normalize/validate
    responses.js                      # JSON / text / CORS helpers
origin-middleware/originProtection.js # backend guard (Express + Base44 variants)
wrangler.toml
```

## Admin API (bearer `VERIFICATION_SECRET`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/custom-domains/register` | Register a domain, create the Cloudflare custom hostname, store KV `pending`, return DNS instructions |
| GET | `/api/custom-domains/status?hostname=` | Poll Cloudflare, update KV status (`pending`/`active`/`failed`/`deleted`) |
| DELETE | `/api/custom-domains?hostname=` | Delete the Cloudflare custom hostname + KV record |
| GET | `/api/domain-for-store?slug=` | Public: active custom domain for a store slug (storefront redirect) |

Register body: `{ "hostname", "tenantId", "originType": "app"|"base44", "storeSlug"? }`.
Response includes `dnsInstructions` (single record) and `dnsRecords` (full list).

## Environment

**Vars** (`wrangler.toml`): `ZONE_ID`, `APP_ORIGIN`, `BASE44_ORIGIN`, `ADMIN_ORIGIN`, `CNAME_TARGET`.
**Secrets** (`wrangler secret put`): `CLOUDFLARE_API_TOKEN`, `VERIFICATION_SECRET`, `ORIGIN_PROXY_SECRET`.
**Backend env**: `ORIGIN_PROXY_SECRET` (same value as the Worker secret).

## Deployment checklist

1. **Cloudflare for SaaS**: SSL/TLS → Custom Hostnames → enable on the `appsfieldai.com` zone.
2. **Fallback origin / CNAME target**: create a proxied DNS record `custom.appsfieldai.com` and set it as the Fallback Origin. This is `CNAME_TARGET`.
3. **API token**: scoped to the zone — `SSL and Certificates: Edit` + `Zone: Read`. Note it + the **Zone ID**.
4. **KV**: `npx wrangler kv namespace create DOMAINS` (and `--preview`) → paste ids into `wrangler.toml`.
5. **Vars**: set `ZONE_ID`, `APP_ORIGIN`, `BASE44_ORIGIN`, `ADMIN_ORIGIN`, `CNAME_TARGET` in `wrangler.toml`.
6. **Secrets**:
   ```bash
   npx wrangler secret put CLOUDFLARE_API_TOKEN
   npx wrangler secret put VERIFICATION_SECRET
   npx wrangler secret put ORIGIN_PROXY_SECRET
   ```
7. **Deploy**: `npx wrangler deploy` (attaches the `*/*` route from `wrangler.toml`).
8. **Exclude the main app**: dashboard → Workers Routes → add `app.appsfieldai.com/*` → Worker: **None**.
9. **Origin**: add `ORIGIN_PROXY_SECRET` to the Render/Base44 backend env and apply the middleware from `origin-middleware/`. Redeploy.
10. **Test** with one real customer subdomain (below).

## Testing checklist

```bash
BASE=https://custom.appsfieldai.com          # any host routed to the Worker
SECRET=<VERIFICATION_SECRET>

# 1) Register
curl -X POST $BASE/api/custom-domains/register \
  -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d '{"hostname":"shop.customerdomain.com","tenantId":"tenant_123","originType":"app"}'
#    → success:true, status:pending, dnsInstructions CNAME → custom.appsfieldai.com

# 2) KV record created?      npx wrangler kv key get --binding=DOMAINS shop.customerdomain.com
# 3) Cloudflare hostname?    dashboard → SSL/TLS → Custom Hostnames (or the API)

# 4) Status
curl "$BASE/api/custom-domains/status?hostname=shop.customerdomain.com" -H "Authorization: Bearer $SECRET"
#    → pending until DNS+SSL validate, then active

# 5) Active domain proxies to origin (after CNAME added + active)
curl -I https://shop.customerdomain.com/     # 200 from the storefront, visitor host preserved

# 6) Tenant headers reach backend — log x-tenant-id / x-original-host at the origin.
# 7) Direct origin access without the secret is blocked (403).
curl -I https://app.appsfieldai.com/storefront   # 403 if the guard is applied

# 8) Unknown domain → 404 "Domain not found in AppsfieldAI."
# 9) Pending domain → 409 "Domain is still being verified."
# 10) Duplicate domain (different tenant) → 409
# 11) Delete
curl -X DELETE "$BASE/api/custom-domains?hostname=shop.customerdomain.com" -H "Authorization: Bearer $SECRET"
```

## Notes / edge cases handled

- Uppercase / `https://` / trailing-slash input is normalized; invalid hostnames rejected.
- Apex domains: Cloudflare needs CNAME-flattening/ALIAS at the root; subdomains are a clean CNAME.
- Duplicate hostname (same tenant) refreshes; different tenant is rejected (409).
- KV record present but Cloudflare hostname deleted → status flips to `deleted` on next check.
- Only configured origins are ever proxied (no open proxy); Host is rewritten to the origin.
- The bearer secret used by the browser dashboard is visible client-side (inherent);
  the `ORIGIN_PROXY_SECRET` is Worker/origin-only and never exposed to the browser.
