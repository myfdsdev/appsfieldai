import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Proxies custom-domain-service requests through the backend so the bearer
// secret (DOMAIN_SERVICE_SECRET) never reaches the browser.
// Frontend calls: base44.functions.invoke('domainServiceProxy', { path, method, body })
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceUrl = Deno.env.get("DOMAIN_SERVICE_URL");
    const serviceSecret = Deno.env.get("DOMAIN_SERVICE_SECRET");
    if (!serviceUrl || !serviceSecret) {
      return Response.json({ error: "Custom domain service is not configured." }, { status: 500 });
    }

    const { path, method = "GET", body } = await req.json();
    if (!path || typeof path !== "string" || !path.startsWith("/")) {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    const base = serviceUrl.replace(/\/$/, "");
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceSecret}`,
      },
      body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body || {}),
    });

    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("domainServiceProxy error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});