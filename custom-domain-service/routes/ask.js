const express = require("express");
const { domains } = require("../db");

const router = express.Router();

// Caddy's on-demand TLS "ask" callback — called before issuing a certificate for
// a hostname it hasn't seen before. Only verified, active domains get a cert;
// anything else is refused, which also acts as an anti-abuse backstop against
// arbitrary internet hosts triggering cert issuance through this service.
router.get("/ask", async (req, res) => {
  const domain = (req.query.domain || "").toLowerCase().trim();
  if (!domain) return res.sendStatus(400);

  try {
    const doc = await domains().findOne({ domain, is_active: true });
    return res.sendStatus(doc ? 200 : 403);
  } catch (err) {
    console.error("ask lookup failed", err.message);
    return res.sendStatus(403);
  }
});

module.exports = router;
