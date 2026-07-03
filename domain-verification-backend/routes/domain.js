const express = require("express");
const { requireBearer } = require("../lib/auth");
const { dnsQuery } = require("../lib/dnsQuery");
const {
  getMarketplace,
  updateMarketplace,
  getConfiguredPlatformDomain,
} = require("../lib/base44Client");

const router = express.Router();

const CNAME_TARGET = process.env.CNAME_TARGET || "base44.onrender.com";

// Normalize a host string: lowercase, drop scheme/path/port, trim.
function cleanHost(host) {
  return (host || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
}

// Sanitize a user-supplied custom domain. Returns the cleaned domain, or null
// if it contains a path separator or any character outside [a-z0-9.-].
function sanitizeDomain(input) {
  const domain = cleanHost(input);
  if (!domain) return null;
  if (!/^[a-z0-9.-]+$/.test(domain)) return null;
  return domain;
}

// Resolve the platform domain: AppConfig (key "main") wins, else PLATFORM_DOMAIN.
// Returns { platformDomain, source }.
async function resolvePlatformDomain() {
  const configured = await getConfiguredPlatformDomain();
  if (configured) {
    return { platformDomain: cleanHost(configured), source: "configured" };
  }
  return {
    platformDomain: cleanHost(process.env.PLATFORM_DOMAIN),
    source: "default",
  };
}

// GET /api/platform-domain — public, no auth.
router.get("/platform-domain", async (req, res) => {
  try {
    const { platformDomain, source } = await resolvePlatformDomain();
    return res.json({
      platformDomain,
      cnameTarget: CNAME_TARGET,
      source,
    });
  } catch (error) {
    console.error("platform-domain error", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/verify-custom-domain — requires bearer auth.
router.post("/verify-custom-domain", requireBearer, async (req, res) => {
  try {
    const { marketplaceId } = req.body || {};
    if (!marketplaceId) {
      return res.status(400).json({ error: "marketplaceId is required" });
    }

    // 1) Fetch the marketplace and enforce ownership.
    let marketplace;
    try {
      marketplace = await getMarketplace(marketplaceId);
    } catch (err) {
      console.error("Base44 getMarketplace failed", err.message);
      return res
        .status(500)
        .json({ error: "Failed to read marketplace from Base44." });
    }
    if (!marketplace) {
      return res.status(404).json({ error: "Marketplace not found" });
    }
    // Only enforce when an acting user id was supplied (see lib/auth.js).
    if (req.authUserId && marketplace.ownerId !== req.authUserId) {
      return res
        .status(403)
        .json({ error: "You do not own this marketplace." });
    }

    // 2) Require a custom domain and verification token.
    const domain = sanitizeDomain(marketplace.customDomain);
    if (!domain) {
      return res
        .status(400)
        .json({ error: "No valid custom domain set on this marketplace." });
    }
    const expectedToken = marketplace.verificationToken;
    if (!expectedToken) {
      return res.status(400).json({
        error: "No verification token. Re-save the domain first.",
      });
    }

    // 3) Resolve platform domain and derive the TXT key.
    const { platformDomain } = await resolvePlatformDomain();
    const txtKey = platformDomain.split(".")[0];

    // 4) The store's live platform address is the required CNAME target.
    const storeSubdomain =
      marketplace.subdomain || marketplace.slug || "store";
    const PLATFORM_CNAME_TARGET = `${storeSubdomain}.${platformDomain}`;

    // 5) TXT record check on _<txtKey>-verify.<domain>
    const txtName = `_${txtKey}-verify.${domain}`;
    const txtRecords = await dnsQuery(txtName, "TXT");
    const txtValues = txtRecords.map((r) =>
      (r.data || "").replace(/^"|"$/g, "")
    );
    const txtMatch = txtValues.some((v) =>
      v.includes(`${txtKey}-verify=${expectedToken}`)
    );

    // 6) CNAME record check — must point at PLATFORM_CNAME_TARGET.
    const cnameRecords = await dnsQuery(domain, "CNAME");
    const cnameValues = cnameRecords.map((r) =>
      (r.data || "").replace(/\.$/, "").toLowerCase()
    );
    const cnameMatch = cnameValues.some((v) => v === PLATFORM_CNAME_TARGET);

    // 7) Both must pass.
    const verified = txtMatch && cnameMatch;

    // 8) Persist the result to Base44.
    const update = {
      verificationStatus: verified ? "verified" : "failed",
      sslStatus: verified ? "active" : "pending",
    };
    if (verified) update.connectedAt = new Date().toISOString();

    try {
      await updateMarketplace(marketplaceId, update);
    } catch (err) {
      console.error("Base44 updateMarketplace failed", err.message);
      return res
        .status(500)
        .json({ error: "Failed to update marketplace in Base44." });
    }

    // 9) Build the response.
    const message = verified
      ? "Domain verified and SSL activated."
      : !txtMatch && !cnameMatch
      ? "Neither the TXT nor CNAME record was found yet. DNS can take up to 48h to propagate."
      : !txtMatch
      ? "CNAME found, but the TXT verification record is missing or incorrect."
      : "TXT record verified, but the CNAME record is missing or incorrect.";

    return res.json({
      verified,
      checks: {
        txt: { name: txtName, found: txtMatch, records: txtValues },
        cname: {
          name: domain,
          found: cnameMatch,
          target: PLATFORM_CNAME_TARGET,
          records: cnameValues,
        },
      },
      message,
    });
  } catch (error) {
    console.error("verify-custom-domain error", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
