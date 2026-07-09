// custom-domain-worker — AppsfieldAI multi-tenant custom domains.
//
// One Worker, attached to the zone via a `*/*` route, handles two things:
//   1. Internal admin API under /api/custom-domains/* (bearer-protected):
//      register, status, delete a customer domain. Registers Custom Hostnames
//      with Cloudflare for SaaS and stores the mapping in KV.
//   2. Public storefront traffic on every customer custom hostname: look up the
//      tenant by hostname in KV and reverse-proxy to the correct origin,
//      injecting tenant headers. Render/Base44 is only ever the origin.
//
// See README.md for setup, testing, and deployment.

import { json, errorJson, CORS_HEADERS } from "./utils/responses.js";
import { normalizeHostname } from "./utils/validation.js";
import {
  handleRegister,
  handleStatus,
  handleDelete,
  handleDomainForStore,
} from "./routes/domainApi.js";
import { handlePublicRequest } from "./services/proxy.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = normalizeHostname(request.headers.get("host") || url.hostname);
    const path = url.pathname;

    // CORS preflight for the admin API.
    if (request.method === "OPTIONS" && path.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check.
    if (path === "/health") return json({ ok: true });

    // --- Internal API routes (handled regardless of host; bearer-protected) ---
    if (path === "/api/custom-domains/register" && request.method === "POST") {
      return handleRegister(request, env);
    }
    if (path === "/api/custom-domains/status" && request.method === "GET") {
      return handleStatus(request, env, url);
    }
    if (path === "/api/custom-domains" && request.method === "DELETE") {
      return handleDelete(request, env, url);
    }
    // Public storefront-redirect helper (no auth).
    if (path === "/api/domain-for-store" && request.method === "GET") {
      return handleDomainForStore(env, url);
    }
    // Any other /api/custom-domains/* → method/route not found.
    if (path.startsWith("/api/custom-domains")) {
      return errorJson("Not found", 404);
    }

    // --- Everything else = public storefront traffic on a custom hostname ---
    return handlePublicRequest(request, env, url, hostname);
  },
};
