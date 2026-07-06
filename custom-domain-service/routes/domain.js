const express = require("express");
const crypto = require("crypto");
const { domains } = require("../db");
const { requireBearer } = require("../lib/auth");
const { dnsQuery } = require("../lib/dnsQuery");

const router = express.Router();

const PUBLIC_SERVICE_HOST = process.env.PUBLIC_SERVICE_HOST || "";
const PUBLIC_SERVICE_IP = process.env.PUBLIC_SERVICE_IP || "";
// Namespace for the TXT verification record — stable regardless of Base44's own
// platform-domain configuration, since this service no longer depends on it.
const TXT_KEY = process.env.TXT_KEY || "appsfieldai";

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

function genToken() {
  return "vk_" + crypto.randomBytes(12).toString("hex");
}

function dnsInstructionsFor(domain) {
  const isRoot = domain.split(".").length === 2;
  return {
    txt: {
      name: isRoot ? `_${TXT_KEY}-verify` : `_${TXT_KEY}-verify.${domain.split(".")[0]}`,
    },
    cname: {
      type: isRoot ? "A" : "CNAME",
      name: isRoot ? "@" : domain.split(".")[0],
      target: isRoot ? PUBLIC_SERVICE_IP : PUBLIC_SERVICE_HOST,
    },
  };
}

function docToState(doc) {
  return {
    domain: doc.domain,
    storeSlug: doc.store_slug,
    verificationStatus: doc.verification_status,
    sslStatus: doc.ssl_status,
    isActive: !!doc.is_active,
    redirectEnabled: !!doc.redirect_enabled,
    createdAt: doc.created_at,
    verifiedAt: doc.verified_at,
  };
}

// POST /api/admin/domains — connect a domain, get DNS instructions.
router.post("/domains", requireBearer, async (req, res) => {
  const { domain: rawDomain, storeSlug, marketplaceId, userId } = req.body || {};
  const domain = sanitizeDomain(rawDomain);
  if (!domain) return res.status(400).json({ error: "A valid domain is required." });
  if (!storeSlug) return res.status(400).json({ error: "storeSlug is required." });

  const existing = await domains().findOne({ domain });
  if (existing && existing.owner_user_id && userId && existing.owner_user_id !== userId) {
    return res.status(403).json({ error: "This domain is already connected to another store." });
  }

  const token = existing?.verification_token || genToken();
  const now = new Date().toISOString();
  await domains().updateOne(
    { domain },
    {
      $set: {
        store_slug: storeSlug,
        marketplace_id: marketplaceId || null,
        owner_user_id: userId || null,
        verification_status: "pending",
        ssl_status: "pending",
        is_active: false,
        updated_at: now,
      },
      $setOnInsert: {
        domain,
        verification_token: token,
        redirect_enabled: true,
        created_at: now,
        verified_at: null,
      },
    },
    { upsert: true }
  );

  const dns = dnsInstructionsFor(domain);
  return res.json({
    domain,
    verificationToken: token,
    dns: {
      txt: { name: dns.txt.name, value: `${TXT_KEY}-verify=${token}` },
      cname: { type: dns.cname.type, name: dns.cname.name, target: dns.cname.target },
    },
  });
});

// GET /api/admin/domains/:domain — current state + DNS instructions (so the UI
// can restore the DNS panel after a page reload, not just right after Connect).
router.get("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });
  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  const dns = dnsInstructionsFor(domain);
  return res.json({
    ...docToState(doc),
    dns: {
      txt: { name: dns.txt.name, value: `${TXT_KEY}-verify=${doc.verification_token}` },
      cname: { type: dns.cname.type, name: dns.cname.name, target: dns.cname.target },
    },
  });
});

// POST /api/admin/domains/:domain/verify — re-check DNS, flip status.
router.post("/domains/:domain/verify", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }

  const isRoot = domain.split(".").length === 2;

  // TXT check — absolute name is always "_<key>-verify.<domain>", root or not.
  const txtName = `_${TXT_KEY}-verify.${domain}`;
  const txtRecords = await dnsQuery(txtName, "TXT");
  const txtValues = txtRecords.map((r) => (r.data || "").replace(/^"|"$/g, ""));
  const txtMatch = txtValues.some((v) => v.includes(`${TXT_KEY}-verify=${doc.verification_token}`));

  // CNAME/A check
  const cnameRecords = await dnsQuery(domain, isRoot ? "A" : "CNAME");
  const cnameValues = cnameRecords.map((r) => (r.data || "").replace(/\.$/, "").toLowerCase());
  const expectedTarget = isRoot ? PUBLIC_SERVICE_IP : PUBLIC_SERVICE_HOST;
  const cnameMatch = cnameValues.some((v) => v === expectedTarget);

  const verified = txtMatch && cnameMatch;

  const set = {
    verification_status: verified ? "verified" : "failed",
    ssl_status: verified ? "active" : "pending",
    is_active: verified,
    updated_at: new Date().toISOString(),
  };
  if (verified) set.verified_at = new Date().toISOString();
  await domains().updateOne({ domain }, { $set: set });

  const message = verified
    ? "Domain verified and SSL activated."
    : !txtMatch && !cnameMatch
    ? "Neither the TXT nor CNAME record was found yet. DNS can take up to 48h to propagate."
    : !txtMatch
    ? "CNAME found, but the TXT verification record is missing or incorrect."
    : "TXT record verified, but the CNAME record is missing or incorrect.";

  return res.json({
    verified,
    verificationStatus: verified ? "verified" : "failed",
    sslStatus: verified ? "active" : "pending",
    checks: {
      txt: { name: txtName, found: txtMatch, records: txtValues },
      cname: { name: domain, found: cnameMatch, target: expectedTarget, records: cnameValues },
    },
    message,
  });
});

// DELETE /api/admin/domains/:domain — remove mapping.
router.delete("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }

  await domains().deleteOne({ domain });
  return res.json({ ok: true });
});

module.exports = router;
