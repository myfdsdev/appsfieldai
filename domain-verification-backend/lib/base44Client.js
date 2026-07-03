const axios = require("axios");

// Thin wrapper over the Base44 REST API (Option 1 from the spec).
// All calls authenticate with the service API key in BASE44_API_KEY.

function client() {
  const baseURL = process.env.BASE44_API_URL || "https://api.base44.com";
  const apiKey = process.env.BASE44_API_KEY;
  if (!apiKey) {
    throw new Error("BASE44_API_KEY is not set");
  }
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

// Fetch a Marketplace record by id. Returns null when Base44 responds 404.
async function getMarketplace(id) {
  try {
    const res = await client().get(
      `/entities/Marketplace/${encodeURIComponent(id)}`
    );
    return res.data || null;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
}

// Apply a partial update to a Marketplace record.
async function updateMarketplace(id, patch) {
  const res = await client().patch(
    `/entities/Marketplace/${encodeURIComponent(id)}`,
    patch
  );
  return res.data;
}

// Read the configured platform domain from AppConfig (key: "main").
// Returns the string, or null if not configured / lookup fails.
async function getConfiguredPlatformDomain() {
  try {
    const res = await client().get("/entities/AppConfig", {
      params: { key: "main" },
    });
    const rows = Array.isArray(res.data) ? res.data : res.data && res.data.data;
    const configured = rows && rows[0] && rows[0].platformDomain;
    return configured || null;
  } catch (err) {
    console.error("AppConfig lookup failed", err.message);
    return null;
  }
}

module.exports = {
  getMarketplace,
  updateMarketplace,
  getConfiguredPlatformDomain,
};
