// Cloudflare for SaaS "Custom Hostnames" API wrappers.
// Each returns { ok, result, error } — callers never see raw fetch/HTTP details.
//
// Docs: https://developers.cloudflare.com/api/resources/custom_hostnames/

function base(env) {
  return `https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/custom_hostnames`;
}
function headers(env) {
  return { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" };
}

function firstError(body) {
  if (body && Array.isArray(body.errors) && body.errors.length) {
    const e = body.errors[0];
    return `${e.message || "Cloudflare error"}${e.code ? ` (code ${e.code})` : ""}`;
  }
  return "Cloudflare API error";
}

// Create a custom hostname with HTTP DCV (single CNAME; cert auto-issues once
// DNS resolves through Cloudflare). tenantId is stored in custom_metadata.
export async function createCustomHostname(env, hostname, tenantId) {
  try {
    const res = await fetch(base(env), {
      method: "POST",
      headers: headers(env),
      body: JSON.stringify({
        hostname,
        custom_metadata: { tenantId },
        ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) return { ok: false, status: res.status, error: firstError(body) };
    return { ok: true, result: body.result };
  } catch (err) {
    return { ok: false, error: `Network error contacting Cloudflare: ${err.message}` };
  }
}

export async function getCustomHostname(env, customHostnameId) {
  try {
    const res = await fetch(`${base(env)}/${encodeURIComponent(customHostnameId)}`, { headers: headers(env) });
    if (res.status === 404) return { ok: true, result: null };
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) return { ok: false, status: res.status, error: firstError(body) };
    return { ok: true, result: body.result };
  } catch (err) {
    return { ok: false, error: `Network error contacting Cloudflare: ${err.message}` };
  }
}

export async function deleteCustomHostname(env, customHostnameId) {
  try {
    const res = await fetch(`${base(env)}/${encodeURIComponent(customHostnameId)}`, {
      method: "DELETE",
      headers: headers(env),
    });
    if (res.status === 404) return { ok: true };
    const body = await res.json().catch(() => ({}));
    if (!res.ok || (body && body.success === false)) return { ok: false, status: res.status, error: firstError(body) };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Network error contacting Cloudflare: ${err.message}` };
  }
}

// Map Cloudflare's hostname object to a simple { status, sslStatus } view.
export function summarizeStatus(cfHostname) {
  const sslStatus = (cfHostname && cfHostname.ssl && cfHostname.ssl.status) || "unknown";
  const cloudflareStatus = (cfHostname && cfHostname.status) || "unknown";
  const active = cloudflareStatus === "active" && sslStatus === "active";
  return { active, sslStatus, cloudflareStatus };
}

// Build the DNS record(s) the customer must add, from Cloudflare's response.
// Usually just the routing CNAME (HTTP DCV); add ownership/SSL TXT if required.
export function buildDnsInstructions(hostname, cfHostname, env) {
  const label = hostname.split(".").length === 2 ? "@" : hostname.split(".")[0];
  const records = [
    { type: "CNAME", name: label, target: env.CNAME_TARGET, purpose: "routing" },
  ];
  const ov = cfHostname && cfHostname.ownership_verification;
  if (ov && ov.type === "txt" && ov.name && ov.value) {
    records.push({ type: "TXT", name: ov.name, target: ov.value, purpose: "ownership" });
  }
  const dcv = cfHostname && cfHostname.ssl && cfHostname.ssl.validation_records;
  if (Array.isArray(dcv)) {
    for (const r of dcv) if (r.txt_name && r.txt_value) records.push({ type: "TXT", name: r.txt_name, target: r.txt_value, purpose: "ssl" });
  }
  // `primary` matches the spec's single-record dnsInstructions shape; `records`
  // is the full list the UI renders.
  return { primary: records[0], records };
}
