const axios = require("axios");

// Resolve DNS records using Cloudflare's DNS-over-HTTPS resolver.
// On any failure (network error, Cloudflare down, non-200) we return an empty
// array so callers can treat it as "record not found yet".
async function dnsQuery(name, type) {
  try {
    const res = await axios.get("https://cloudflare-dns.com/dns-query", {
      params: { name, type },
      headers: { accept: "application/dns-json" },
      timeout: 8000,
    });
    return res.data && Array.isArray(res.data.Answer) ? res.data.Answer : [];
  } catch (err) {
    console.error(`DNS query failed for ${name} (${type})`, err.message);
    return [];
  }
}

module.exports = { dnsQuery };
