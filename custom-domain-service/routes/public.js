const express = require("express");
const { domains } = require("../db");

const router = express.Router();

// GET /api/domain-for-store?slug=X — public, no auth.
// Used by StorePage.jsx (app.appsfieldai.com/store/:slug) to decide whether to
// redirect visitors to the store's verified custom domain.
router.get("/domain-for-store", async (req, res) => {
  const slug = (req.query.slug || "").toLowerCase().trim();
  if (!slug) return res.json({ customDomain: null, redirectEnabled: false });

  try {
    const doc = await domains().findOne({ store_slug: slug, is_active: true });
    if (!doc) return res.json({ customDomain: null, redirectEnabled: false });
    return res.json({ customDomain: doc.domain, redirectEnabled: !!doc.redirect_enabled });
  } catch (err) {
    console.error("domain-for-store lookup failed", err.message);
    return res.json({ customDomain: null, redirectEnabled: false });
  }
});

module.exports = router;
