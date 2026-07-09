// Internal admin API for custom-domain onboarding. All routes require
// `Authorization: Bearer VERIFICATION_SECRET`.

import { json, errorJson } from "../utils/responses.js";
import { normalizeHostname, isValidHostname, isInternalDomain } from "../utils/validation.js";
import { getDomain, putDomain, deleteDomain, domainForSlug } from "../services/domainStore.js";
import {
  createCustomHostname,
  getCustomHostname,
  deleteCustomHostname,
  summarizeStatus,
  buildDnsInstructions,
} from "../services/cloudflareCustomHostnames.js";

// Bearer check. Returns null when authorized, or an error Response.
function requireAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = (auth.match(/^Bearer\s+(.+)$/i) || [])[1];
  if (!token || token !== env.VERIFICATION_SECRET) {
    return errorJson("Unauthorized", 401);
  }
  return null;
}

// POST /api/custom-domains/register
export async function handleRegister(request, env) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;

  const body = await request.json().catch(() => ({}));
  const hostname = normalizeHostname(body.hostname);
  const tenantId = (body.tenantId || "").toString().trim();
  const originType = (body.originType || "app").toString().trim();
  const storeSlug = body.storeSlug ? body.storeSlug.toString().trim() : null;

  if (!hostname) return errorJson("hostname is required", 400);
  if (!tenantId) return errorJson("tenantId is required", 400);
  if (!isValidHostname(hostname)) return errorJson("Invalid hostname", 400);
  if (isInternalDomain(hostname, env)) return errorJson("This domain cannot be used", 400);

  const existing = await getDomain(env, hostname);
  if (existing) {
    if (existing.tenantId && existing.tenantId !== tenantId) {
      return errorJson("This domain is already connected to another tenant", 409);
    }
    // Same tenant re-registering — fall through and refresh from Cloudflare.
  }

  const cf = await createCustomHostname(env, hostname, tenantId);
  if (!cf.ok) {
    // Duplicate/invalid/permission errors surface as clean JSON.
    const status = cf.status === 403 ? 403 : 400;
    return errorJson(`Cloudflare: ${cf.error}`, status);
  }

  const now = new Date().toISOString();
  const record = {
    tenantId,
    hostname,
    status: "pending",
    originType: originType === "base44" ? "base44" : "app",
    storeSlug,
    cloudflareCustomHostnameId: cf.result.id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await putDomain(env, hostname, record);

  const dns = buildDnsInstructions(hostname, cf.result, env);
  return json({
    success: true,
    hostname,
    status: "pending",
    cnameTarget: env.CNAME_TARGET,
    dnsInstructions: dns.primary,
    dnsRecords: dns.records,
  });
}

// GET /api/custom-domains/status?hostname=...
export async function handleStatus(request, env, url) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;

  const hostname = normalizeHostname(url.searchParams.get("hostname"));
  if (!hostname) return errorJson("hostname is required", 400);

  const record = await getDomain(env, hostname);
  if (!record) return errorJson("Domain not found", 404);

  if (!record.cloudflareCustomHostnameId) {
    return errorJson("Domain has no Cloudflare hostname id. Re-register it.", 400);
  }

  const cf = await getCustomHostname(env, record.cloudflareCustomHostnameId);
  if (!cf.ok) return errorJson(`Cloudflare: ${cf.error}`, 502);

  // KV record exists but Cloudflare hostname was deleted → mark deleted.
  if (!cf.result) {
    record.status = "deleted";
    record.updatedAt = new Date().toISOString();
    await putDomain(env, hostname, record);
    return json({ success: true, hostname, status: "deleted" });
  }

  const { active, sslStatus, cloudflareStatus } = summarizeStatus(cf.result);
  const now = new Date().toISOString();
  if (active && record.status !== "active") {
    record.status = "active";
    record.activatedAt = now;
  } else if (!active && record.status === "active") {
    // Was active, now not — reflect reality.
    record.status = "pending";
  } else if (!active && record.status !== "active") {
    record.status = "pending";
  }
  record.updatedAt = now;
  await putDomain(env, hostname, record);

  const dns = buildDnsInstructions(hostname, cf.result, env);
  return json({
    success: true,
    hostname,
    status: record.status,
    sslStatus,
    cloudflareStatus,
    dnsInstructions: dns.primary,
    dnsRecords: dns.records,
  });
}

// DELETE /api/custom-domains?hostname=...
export async function handleDelete(request, env, url) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;

  const hostname = normalizeHostname(url.searchParams.get("hostname"));
  if (!hostname) return errorJson("hostname is required", 400);

  const record = await getDomain(env, hostname);
  if (!record) return errorJson("Domain not found", 404);

  if (record.cloudflareCustomHostnameId) {
    const cf = await deleteCustomHostname(env, record.cloudflareCustomHostnameId);
    // Continue even if Cloudflare delete failed — we still remove our mapping.
    if (!cf.ok) console.log("Cloudflare delete failed:", cf.error);
  }
  await deleteDomain(env, hostname);
  return json({ success: true, hostname, status: "deleted" });
}

// GET /api/domain-for-store?slug=...  (public, no auth — storefront redirect helper)
export async function handleDomainForStore(env, url) {
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();
  if (!slug) return json({ customDomain: null, redirectEnabled: false });
  const record = await domainForSlug(env, slug);
  if (!record || record.status !== "active") return json({ customDomain: null, redirectEnabled: false });
  return json({ customDomain: record.hostname, redirectEnabled: record.redirectEnabled !== false });
}
