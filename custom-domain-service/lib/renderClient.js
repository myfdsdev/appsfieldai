const axios = require("axios");

// Thin client over Render's custom-domains API. Render terminates TLS at its
// edge and issues a Let's Encrypt certificate for each custom domain once its
// DNS points at our Render service — so this service delegates verification and
// certificate issuance to Render rather than doing it (or running Caddy) itself.
//
// Docs: https://api-docs.render.com/reference/create-custom-domain

function client() {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) throw new Error("RENDER_API_KEY is not set");
  return axios.create({
    baseURL: "https://api.render.com/v1",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    timeout: 15000,
  });
}

function serviceId() {
  const id = process.env.RENDER_SERVICE_ID;
  if (!id) throw new Error("RENDER_SERVICE_ID is not set");
  return id;
}

// Add a custom domain to our Render service. Returns Render's domain object
// ({ id, name, domainType, verificationStatus, ... }). If the domain already
// exists on the service, returns the existing record instead of throwing.
async function addDomain(name) {
  try {
    const res = await client().post(`/services/${serviceId()}/custom-domains`, { name });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 409) {
      return getDomain(name);
    }
    throw err;
  }
}

// Retrieve a custom domain by id or name. Returns null on 404.
async function getDomain(idOrName) {
  try {
    const res = await client().get(
      `/services/${serviceId()}/custom-domains/${encodeURIComponent(idOrName)}`
    );
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
}

// Trigger a fresh DNS verification for a custom domain. Render also verifies
// automatically in the background; this nudges it after the customer sets DNS.
async function verifyDomain(idOrName) {
  await client().post(
    `/services/${serviceId()}/custom-domains/${encodeURIComponent(idOrName)}/verify`
  );
}

// Delete a custom domain from our Render service. Ignores 404 (already gone).
async function deleteDomain(idOrName) {
  try {
    await client().delete(
      `/services/${serviceId()}/custom-domains/${encodeURIComponent(idOrName)}`
    );
  } catch (err) {
    if (err.response && err.response.status === 404) return;
    throw err;
  }
}

module.exports = { addDomain, getDomain, verifyDomain, deleteDomain };
