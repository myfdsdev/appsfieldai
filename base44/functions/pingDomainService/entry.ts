// Keeps the custom-domain-service (Render) awake by hitting its /health endpoint.
// Free Render web services sleep after ~15 min idle and cold-start (30-60s) on the
// next request, which causes 504 Gateway Timeouts on the first store page loads.
// A scheduled ping every 10 min keeps it warm.
Deno.serve(async (req) => {
  try {
    const serviceUrl = Deno.env.get("DOMAIN_SERVICE_URL") || "https://appsfieldai.onrender.com";
    const base = serviceUrl.replace(/\/$/, "");
    const start = Date.now();
    const res = await fetch(`${base}/health`);
    const elapsed = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    console.log(`Pinged ${base}/health → ${res.status} in ${elapsed}ms`, data);
    return Response.json({ ok: res.ok, status: res.status, elapsedMs: elapsed, data });
  } catch (error) {
    console.error("pingDomainService error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});