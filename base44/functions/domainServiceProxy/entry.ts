import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Proxies custom-domain-service requests through the backend so the bearer
// secret (DOMAIN_SERVICE_SECRET) never reaches the browser.
// Frontend calls: base44.functions.invoke('domainServiceProxy', { path, method, body })
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceUrl = Deno.env.get("DOMAIN_SERVICE_URL") || "https://appsfieldai.onrender.com";
    const serviceSecret = Deno.env.get("DOMAIN_SERVICE_SECRET") || "c81eb879bca1bd6c10522df3a0429de333ac2d28cd2986e90de982bc46dc71ab";

    const { path, method = "GET", body } = await req.json();
    if (!path || typeof path !== "string" || !path.startsWith("/")) {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    const base = serviceUrl.replace(/\/$/, "");

    // Render's free tier sleeps when idle; the first request cold-starts it and can
    // take 30-60s, during which Cloudflare/the gateway may return 502/503/504.
    // Retry a few times with backoff so a cold start doesn't surface as an error.
    const doFetch = () => fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceSecret}`,
      },
      body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body || {}),
      signal: AbortSignal.timeout(60000),
    });

    let res;
    let lastErr;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        res = await doFetch();
        // Retry on gateway errors (cold start), otherwise use the response as-is.
        if ([502, 503, 504].includes(res.status) && attempt < maxAttempts) {
          console.warn(`domainServiceProxy: gateway ${res.status} on attempt ${attempt}, retrying...`);
          await new Promise((r) => setTimeout(r, attempt * 3000));
          continue;
        }
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`domainServiceProxy: fetch failed on attempt ${attempt}: ${err.message}`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 3000));
          continue;
        }
        throw lastErr;
      }
    }

    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("domainServiceProxy error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});