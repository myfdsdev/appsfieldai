const express = require("express");
const { domains } = require("../db");
const { requireBearer } = require("../lib/auth");
const render = require("../lib/renderClient");

const router = express.Router();

// The CNAME target (our Render service host) and apex A-record IP shown to
// customers. Both are Render's — a subdomain CNAMEs to our onrender host, an
// apex domain uses an A record to Render's shared IP.
const PUBLIC_SERVICE_HOST = process.env.PUBLIC_SERVICE_HOST || "";
const PUBLIC_SERVICE_IP = process.env.PUBLIC_SERVICE_IP || "216.24.57.1";

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

// The single DNS record a customer must add. Render verifies ownership and
// issues the TLS cert once this resolves to our Render service.
function dnsInstructionFor(domain) {
  const isRoot = domain.split(".").length === 2;
  return isRoot
    ? { type: "A", name: "@", target: PUBLIC_SERVICE_IP }
    : { type: "CNAME", name: domain.split(".")[0], target: PUBLIC_SERVICE_HOST };
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
    dns: dnsInstructionFor(doc.domain),
  };
}

// POST /api/admin/domains — connect a domain: register it on Render, return DNS.
router.post("/domains", requireBearer, async (req, res) => {
  const { domain: rawDomain, storeSlug, marketplaceId, userId } = req.body || {};
  const domain = sanitizeDomain(rawDomain);
  if (!domain) return res.status(400).json({ error: "A valid domain is required." });
  if (!storeSlug) return res.status(400).json({ error: "storeSlug is required." });

  const existing = await domains().findOne({ domain });
  if (existing && existing.owner_user_id && userId && existing.owner_user_id !== userId) {
    return res.status(403).json({ error: "This domain is already connected to another store." });
  }

  // Register the domain on our Render service (idempotent — 409 returns existing).
  let renderDomain;
  try {
    renderDomain = await render.addDomain(domain);
  } catch (err) {
    console.error("Render addDomain failed", err.response?.data || err.message);
    return res.status(502).json({ error: "Could not register the domain with the hosting provider." });
  }

  const now = new Date().toISOString();
  await domains().updateOne(
    { domain },
    {
      $set: {
        store_slug: storeSlug,
        marketplace_id: marketplaceId || null,
        owner_user_id: userId || null,
        render_domain_id: renderDomain?.id || null,
        verification_status: "pending",
        ssl_status: "pending",
        is_active: false,
        updated_at: now,
      },
      $setOnInsert: {
        domain,
        redirect_enabled: true,
        created_at: now,
        verified_at: null,
      },
    },
    { upsert: true }
  );

  return res.json({ domain, dns: dnsInstructionFor(domain) });
});

// GET /api/admin/domains/:domain — current state + DNS instruction.
router.get("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });
  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  return res.json(docToState(doc));
});

// POST /api/admin/domains/:domain/verify — ask Render to (re)verify, read status.
router.post("/domains/:domain/verify", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }

  const idOrName = doc.render_domain_id || domain;
  let renderDomain;
  try {
    await render.verifyDomain(idOrName);
    renderDomain = await render.getDomain(idOrName);
  } catch (err) {
    console.error("Render verify failed", err.response?.data || err.message);
    return res.status(502).json({ error: "Could not check domain verification with the hosting provider." });
  }

  const verified = renderDomain?.verificationStatus === "verified";
  const set = {
    verification_status: verified ? "verified" : "failed",
    // Render issues the TLS cert automatically once the domain is verified.
    ssl_status: verified ? "active" : "pending",
    is_active: verified,
    updated_at: new Date().toISOString(),
  };
  if (verified) set.verified_at = new Date().toISOString();
  await domains().updateOne({ domain }, { $set: set });

  const message = verified
    ? "Domain verified and SSL activated."
    : "DNS not verified yet. Add the record below and allow a few minutes to propagate (up to 48h).";

  return res.json({
    verified,
    verificationStatus: set.verification_status,
    sslStatus: set.ssl_status,
    dns: dnsInstructionFor(domain),
    message,
  });
});

// DELETE /api/admin/domains/:domain — remove from Render and our DB.
router.delete("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }

  try {
    await render.deleteDomain(doc.render_domain_id || domain);
  } catch (err) {
    console.error("Render deleteDomain failed", err.response?.data || err.message);
    // Continue — we still remove our own mapping so the store stops routing here.
  }

  await domains().deleteOne({ domain });
  return res.json({ ok: true });
});

module.exports = router;
