const express = require("express");
const { domains } = require("../db");
const { requireBearer } = require("../lib/auth");
const cf = require("../lib/cloudflareClient");

const router = express.Router();

// The CNAME value customers point their domain at (a hostname in our Cloudflare
// zone that is designated as the Custom Hostnames fallback origin / target).
const CF_CNAME_TARGET = process.env.CF_CNAME_TARGET || process.env.PUBLIC_SERVICE_HOST || "";

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

// Build the list of DNS records the customer must add, from Cloudflare's
// custom-hostname response. Always includes the routing CNAME; adds Cloudflare's
// ownership-verification TXT and any SSL (DCV) validation records if present.
function buildDnsRecords(domain, cfHostname) {
  const isRoot = domain.split(".").length === 2;
  const records = [
    {
      type: "CNAME",
      name: isRoot ? "@" : domain.split(".")[0],
      value: CF_CNAME_TARGET,
      purpose: "routing",
    },
  ];

  const ov = cfHostname && cfHostname.ownership_verification;
  if (ov && ov.type === "txt" && ov.name && ov.value) {
    records.push({ type: "TXT", name: ov.name, value: ov.value, purpose: "ownership" });
  }

  const dcv = cfHostname && cfHostname.ssl && cfHostname.ssl.validation_records;
  if (Array.isArray(dcv)) {
    for (const r of dcv) {
      if (r.txt_name && r.txt_value) {
        records.push({ type: "TXT", name: r.txt_name, value: r.txt_value, purpose: "ssl" });
      }
    }
  }
  return records;
}

function docToState(doc, records) {
  return {
    domain: doc.domain,
    storeSlug: doc.store_slug,
    verificationStatus: doc.verification_status,
    sslStatus: doc.ssl_status,
    isActive: !!doc.is_active,
    redirectEnabled: !!doc.redirect_enabled,
    createdAt: doc.created_at,
    verifiedAt: doc.verified_at,
    dns: { records: records || [{ type: "CNAME", name: doc.domain.split(".").length === 2 ? "@" : doc.domain.split(".")[0], value: CF_CNAME_TARGET, purpose: "routing" }] },
  };
}

// POST /api/admin/domains — register the domain on Cloudflare, return DNS records.
router.post("/domains", requireBearer, async (req, res) => {
  const { domain: rawDomain, storeSlug, marketplaceId, userId } = req.body || {};
  const domain = sanitizeDomain(rawDomain);
  if (!domain) return res.status(400).json({ error: "A valid domain is required." });
  if (!storeSlug) return res.status(400).json({ error: "storeSlug is required." });

  const existing = await domains().findOne({ domain });
  if (existing && existing.owner_user_id && userId && existing.owner_user_id !== userId) {
    return res.status(403).json({ error: "This domain is already connected to another store." });
  }

  let cfHostname;
  try {
    cfHostname = await cf.createCustomHostname(domain);
  } catch (err) {
    console.error("Cloudflare createCustomHostname failed", err.cfErrors || err.message);
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
        cf_hostname_id: cfHostname.id || null,
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

  return res.json({ domain, dns: { records: buildDnsRecords(domain, cfHostname) } });
});

// GET /api/admin/domains/:domain — current state + DNS records (refreshed from CF).
router.get("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });
  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });

  let records;
  if (doc.cf_hostname_id) {
    try {
      const cfHostname = await cf.getCustomHostname(doc.cf_hostname_id);
      if (cfHostname) records = buildDnsRecords(domain, cfHostname);
    } catch (err) {
      console.error("Cloudflare getCustomHostname failed", err.cfErrors || err.message);
    }
  }
  return res.json(docToState(doc, records));
});

// POST /api/admin/domains/:domain/verify — read Cloudflare status, flip our flags.
router.post("/domains/:domain/verify", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }
  if (!doc.cf_hostname_id) {
    return res.status(400).json({ error: "Domain is not registered. Re-connect it first." });
  }

  let cfHostname;
  try {
    cfHostname = await cf.getCustomHostname(doc.cf_hostname_id);
  } catch (err) {
    console.error("Cloudflare getCustomHostname failed", err.cfErrors || err.message);
    return res.status(502).json({ error: "Could not check domain status with the hosting provider." });
  }
  if (!cfHostname) return res.status(404).json({ error: "Domain not found at the hosting provider." });

  const sslActive = cfHostname.ssl && cfHostname.ssl.status === "active";
  const verified = cfHostname.status === "active" && sslActive;

  const set = {
    verification_status: verified ? "verified" : "failed",
    ssl_status: sslActive ? "active" : "pending",
    is_active: verified,
    updated_at: new Date().toISOString(),
  };
  if (verified) set.verified_at = new Date().toISOString();
  await domains().updateOne({ domain }, { $set: set });

  const message = verified
    ? "Domain verified and SSL activated."
    : "Not verified yet. Add the DNS record(s) below and allow a few minutes for Cloudflare to validate (up to 48h for DNS to propagate).";

  return res.json({
    verified,
    verificationStatus: set.verification_status,
    sslStatus: set.ssl_status,
    dns: { records: buildDnsRecords(domain, cfHostname) },
    message,
  });
});

// DELETE /api/admin/domains/:domain — remove from Cloudflare and our DB.
router.delete("/domains/:domain", requireBearer, async (req, res) => {
  const domain = sanitizeDomain(req.params.domain);
  if (!domain) return res.status(400).json({ error: "Invalid domain." });

  const doc = await domains().findOne({ domain });
  if (!doc) return res.status(404).json({ error: "Domain mapping not found." });
  if (req.authUserId && doc.owner_user_id && doc.owner_user_id !== req.authUserId) {
    return res.status(403).json({ error: "You do not own this domain mapping." });
  }

  if (doc.cf_hostname_id) {
    try {
      await cf.deleteCustomHostname(doc.cf_hostname_id);
    } catch (err) {
      console.error("Cloudflare deleteCustomHostname failed", err.cfErrors || err.message);
      // Continue — still remove our mapping so the store stops routing here.
    }
  }

  await domains().deleteOne({ domain });
  return res.json({ ok: true });
});

module.exports = router;
