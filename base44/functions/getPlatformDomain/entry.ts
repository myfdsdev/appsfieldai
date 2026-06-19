import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns the platform domain that customer subdomains / custom-domains should
// be based on. Resolution order:
//   1. Explicit platformDomain saved in AppConfig (admin-controlled, most reliable)
//   2. The X-Forwarded-Host / Origin / Referer of the live request (auto-detects
//      the Base44 custom domain the app is actually being served on)
//   3. Fallback to the default <appId>.base44.app host
// The real host Base44 serves this app on — every subdomain / custom domain
// must CNAME here (NOT back at the platform's own root domain, which causes
// Cloudflare Error 1000 "DNS points to prohibited IP").
const CNAME_TARGET = "base44.onrender.com";

function rootDomain(host) {
  const clean = (host || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
  if (!clean) return null;
  const parts = clean.split(".");
  // Treat the registrable root (last 2 labels) as the platform domain,
  // so a custom domain like deals.acme.com becomes acme.com.
  return parts.length > 2 ? parts.slice(-2).join(".") : clean;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const appId = Deno.env.get("BASE44_APP_ID");

    // 1) Admin-configured platform domain wins.
    try {
      const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: "main" });
      const configured = configs?.[0]?.platformDomain;
      if (configured) {
        const root = rootDomain(configured);
        return Response.json({ platformDomain: root, cnameTarget: CNAME_TARGET, source: "configured" });
      }
    } catch (err) {
      console.error("AppConfig lookup failed", err);
    }

    // 2) Auto-detect from the live request host (the Base44 custom domain in use).
    const candidateHosts = [
      req.headers.get("x-forwarded-host"),
      req.headers.get("origin"),
      req.headers.get("referer"),
      req.headers.get("host"),
    ].filter(Boolean);

    for (const h of candidateHosts) {
      const root = rootDomain(h);
      // Skip internal/base44 infra hosts — only accept a real custom domain.
      if (root && !root.includes("base44.") && !root.includes("127.0.0.1") && !root.includes("localhost")) {
        return Response.json({ platformDomain: root, cnameTarget: CNAME_TARGET, source: "auto_detected" });
      }
    }

    // 3) Fallback to the default app host.
    const fallback = `${appId}.base44.app`;
    return Response.json({ platformDomain: fallback, cnameTarget: CNAME_TARGET, source: "default" });
  } catch (error) {
    console.error("getPlatformDomain error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});