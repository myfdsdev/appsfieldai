const axios = require("axios");

// Thin client over Cloudflare for SaaS "Custom Hostnames". Cloudflare issues and
// renews a TLS certificate for each customer domain and routes its traffic (with
// the original Host preserved) to this zone's fallback origin — so this service
// delegates verification + certificate issuance to Cloudflare.
//
// Docs: https://developers.cloudflare.com/api/resources/custom_hostnames/

function client() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set");
  return axios.create({
    baseURL: "https://api.cloudflare.com/client/v4",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    timeout: 15000,
  });
}

function zoneId() {
  const id = process.env.CLOUDFLARE_ZONE_ID;
  if (!id) throw new Error("CLOUDFLARE_ZONE_ID is not set");
  return id;
}

// Cloudflare wraps every response in { success, errors, result }. Unwrap or throw.
function unwrap(res) {
  const body = res.data || {};
  if (!body.success) {
    const msg = (body.errors || []).map((e) => e.message).join("; ") || "Cloudflare API error";
    const err = new Error(msg);
    err.cfErrors = body.errors;
    throw err;
  }
  return body.result;
}

// Create a custom hostname. HTTP DCV means the customer adds a single CNAME and
// the cert validates automatically once traffic flows through Cloudflare.
// Returns CF's hostname object ({ id, hostname, status, ssl, ownership_verification, ... }).
async function createCustomHostname(hostname) {
  const res = await client().post(`/zones/${zoneId()}/custom_hostnames`, {
    hostname,
    ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
  });
  return unwrap(res);
}

// Retrieve a custom hostname by its Cloudflare id. Returns null on 404.
async function getCustomHostname(id) {
  try {
    const res = await client().get(
      `/zones/${zoneId()}/custom_hostnames/${encodeURIComponent(id)}`
    );
    return unwrap(res);
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
}

// Delete a custom hostname by id. Ignores 404 (already gone).
async function deleteCustomHostname(id) {
  try {
    await client().delete(`/zones/${zoneId()}/custom_hostnames/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.response && err.response.status === 404) return;
    throw err;
  }
}

module.exports = { createCustomHostname, getCustomHostname, deleteCustomHostname };
