// Origin protection — deliverable for requirement #5.
//
// Goal: public tenant storefront routes on the origin should ONLY accept requests
// coming from the custom-domain Worker (which adds a shared secret header), and
// must not trust x-tenant-id / x-original-host from arbitrary public callers.
//
// The Worker sends, on every proxied request:
//   x-appsfield-proxy-secret: <ORIGIN_PROXY_SECRET>
//   x-tenant-id:              <tenantId>
//   x-original-host:          <shop.customerdomain.com>
//   x-origin-type:            app | base44
//
// Set ORIGIN_PROXY_SECRET in the origin's environment to the SAME value as the
// Worker secret of the same name.

// ---------------------------------------------------------------------------
// Express / Node origin
// ---------------------------------------------------------------------------
function requireWorkerProxy(req, res, next) {
  const proxySecret = req.headers["x-appsfield-proxy-secret"];
  if (!proxySecret || proxySecret !== process.env.ORIGIN_PROXY_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  // Only trust these AFTER the secret checks out.
  req.tenantId = req.headers["x-tenant-id"] || null;
  req.originalHost = req.headers["x-original-host"] || null;
  next();
}

// Usage:
//   app.use("/storefront", requireWorkerProxy);
//   app.get("/storefront/*", (req, res) => {
//     const data = loadStorefront(req.tenantId);   // trusted tenant id
//     ...
//   });

module.exports = { requireWorkerProxy };

// ---------------------------------------------------------------------------
// Base44 backend function (Deno) variant
// ---------------------------------------------------------------------------
//
// Base44 serves the storefront as a client-side SPA (there is no Express server
// for the HTML), so this header check cannot gate the static HTML itself — the
// SPA already resolves the store client-side from window.location.hostname.
// Where it DOES apply is any Base44 *function* that serves tenant data and should
// only run behind the Worker. Add this guard at the top of such a function:
//
//   Deno.serve(async (req) => {
//     const proxySecret = req.headers.get("x-appsfield-proxy-secret");
//     if (proxySecret !== Deno.env.get("ORIGIN_PROXY_SECRET")) {
//       return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
//     }
//     const tenantId = req.headers.get("x-tenant-id");
//     const originalHost = req.headers.get("x-original-host");
//     // ... load + return storefront data for tenantId ...
//   });
//
// NOTE: getMarketplacePublic is intentionally public (anonymous storefront
// visitors call it), so do NOT lock it behind the proxy secret — that would break
// normal store loads. Apply this guard only to functions that must be Worker-only.
