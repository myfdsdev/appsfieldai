// Compatibility layer for the EXISTING AppsfieldAI Base44 app, which calls the
// old Render-service API shape via its `domainServiceProxy` function:
//   POST   /api/admin/domains                     { domain, storeSlug, marketplaceId, userId }
//   GET    /api/admin/domains/:domain
//   POST   /api/admin/domains/:domain/verify      { userId }
//   DELETE /api/admin/domains/:domain             { userId }
//
// These map onto the same Cloudflare-for-SaaS + KV backend as the /api/custom-domains
// routes, but return the response shape that Base44's DomainManager expects
// ({ verificationStatus, sslStatus, dns: { type, name, target }, verified, message }).
// This lets the app work by pointing DOMAIN_SERVICE_URL at this Worker — no frontend change.

import { json, errorJson } from "../utils/responses.js";
import { normalizeHostname, isValidHostname, isInternalDomain } from "../utils/validation.js";
import { getDomain, putDomain, deleteDomain } from "../services/domainStore.js";
import {
  createCustomHostname,
  getCustomHostname,
  deleteCustomHostname,
  summarizeStatus,
} from "../services/cloudflareCustomHostnames.js";

function requireAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = (auth.match(/^Bearer\s+(.+)$/i) || [])[1];
  return token && token === env.VERIFICATION_SECRET;
}

// Single DNS record in the shape DomainManager renders (type/name/target).
function dnsRecord(hostname, env) {
  const isRoot = hostname.split(".").length === 2;
  return { type: isRoot ? "A" : "CNAME", name: isRoot ? "@" : hostname.split(".")[0], target: env.CNAME_TARGET };
}

// Map Cloudflare status → the app's { verificationStatus, sslStatus }.
function appStatus(cfHostname) {
  const { active, sslStatus } = summarizeStatus(cfHostname);
  return {
    verificationStatus: active ? "verified" : "pending",
    sslStatus: sslStatus === "active" ? "active" : "pending",
  };
}

// Entry point: handle any /api/admin/domains* request. Returns a Response, or
// null if the path/method isn't one of ours.
export async function handleAdminCompat(request, env, url) {
  if (!url.pathname.startsWith("/api/admin/domains")) return null;
  if (!requireAuth(request, env)) return errorJson("Unauthorized", 401);

  const method = request.method;

  // POST /api/admin/domains — connect.
  if (url.pathname === "/api/admin/domains" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const hostname = normalizeHostname(body.domain);
    if (!hostname || !isValidHostname(hostname)) return errorJson("A valid domain is required", 400);
    if (isInternalDomain(hostname, env)) return errorJson("This domain cannot be used", 400);

    const existing = await getDomain(env, hostname);
    if (existing && existing.ownerUserId && body.userId && existing.ownerUserId !== body.userId) {
      return errorJson("This domain is already connected to another store", 409);
    }

    const cf = await createCustomHostname(env, hostname, body.marketplaceId);
    if (!cf.ok) return errorJson(`Cloudflare: ${cf.error}`, cf.status === 403 ? 403 : 400);

    const now = new Date().toISOString();
    await putDomain(env, hostname, {
      domain: hostname,
      tenantId: body.marketplaceId || null,
      marketplaceId: body.marketplaceId || null,
      ownerUserId: body.userId || null,
      storeSlug: body.storeSlug || null,
      originType: "app",
      status: "pending",
      cloudflareCustomHostnameId: cf.result.id,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    });
    return json({ verificationStatus: "pending", sslStatus: "pending", dns: dnsRecord(hostname, env) });
  }

  // Routes with a :domain segment.
  const m = url.pathname.match(/^\/api\/admin\/domains\/([^/]+)(\/verify)?$/);
  if (m) {
    const hostname = normalizeHostname(decodeURIComponent(m[1]));
    const rec = await getDomain(env, hostname);
    if (!rec) return errorJson("Domain not found", 404);

    // DELETE /api/admin/domains/:domain
    if (!m[2] && method === "DELETE") {
      if (rec.cloudflareCustomHostnameId) {
        try { await deleteCustomHostname(env, rec.cloudflareCustomHostnameId); } catch (_) {}
      }
      await deleteDomain(env, hostname);
      return json({ ok: true });
    }

    // GET or POST /verify — read Cloudflare status.
    const isVerify = !!m[2];
    if ((isVerify && method === "POST") || (!isVerify && method === "GET")) {
      let cfHostname = null;
      if (rec.cloudflareCustomHostnameId) {
        const cf = await getCustomHostname(env, rec.cloudflareCustomHostnameId);
        if (cf.ok) cfHostname = cf.result;
      }
      const st = appStatus(cfHostname);
      // Persist status back to KV.
      rec.status = st.verificationStatus === "verified" ? "active" : "pending";
      rec.updatedAt = new Date().toISOString();
      if (st.verificationStatus === "verified" && !rec.activatedAt) rec.activatedAt = rec.updatedAt;
      await putDomain(env, hostname, rec);

      const verified = st.verificationStatus === "verified";
      return json({
        ...st,
        dns: dnsRecord(hostname, env),
        verified,
        message: verified
          ? "Domain verified and SSL activated."
          : "Not verified yet. Add the DNS record below and allow a few minutes for Cloudflare to validate (up to 48h for DNS).",
      });
    }
  }

  return errorJson("Not found", 404);
}
