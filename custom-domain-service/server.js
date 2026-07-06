require("dotenv").config();
const express = require("express");
const { connect } = require("./db");
const adminDomainRoutes = require("./routes/domain");
const askRoutes = require("./routes/ask");
const publicRoutes = require("./routes/public");
const storeProxy = require("./middleware/storeProxy");

const app = express();

app.use(express.json());

// CORS — allow the Base44 frontend (different origin) to call the admin/public
// API. Scoped to /api only — the store-proxy fallback below serves proxied
// HTML/JS/CSS/images from Base44 and must not have its content-type overridden.
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/admin", adminDomainRoutes);
app.use("/api", askRoutes);
app.use("/api", publicRoutes);

// Anything else is a custom-domain request — look it up and reverse-proxy it
// to the live Base44 app (only ever reached via a verified customer domain,
// never via app.appsfieldai.com, which resolves to Base44 directly).
app.use(storeProxy);

// Central error handler (e.g. malformed JSON body).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`custom-domain-service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB — exiting.", err.message);
    process.exit(1);
  });

module.exports = app;
