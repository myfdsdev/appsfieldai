require("dotenv").config();
const express = require("express");
const domainRoutes = require("./routes/domain");

const app = express();

app.use(express.json());

// CORS — allow the Base44 frontend (different origin) to call these endpoints.
// Defaults to "*"; set CORS_ORIGIN to lock it to a specific origin.
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-User-Id"
  );
  res.header("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", domainRoutes);

// 404 fallback.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler (e.g. malformed JSON body).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Domain verification backend listening on port ${PORT}`);
});

module.exports = app;
