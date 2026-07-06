const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");
const { domains } = require("../db");
const { rewriteHtml } = require("../lib/htmlRewrite");

const UPSTREAM_ORIGIN = process.env.UPSTREAM_ORIGIN || "https://app.appsfieldai.com";

const proxy = createProxyMiddleware({
  target: UPSTREAM_ORIGIN,
  changeOrigin: true, // Host header is set to match UPSTREAM_ORIGIN — confirmed this
  // works as a normal reverse-proxy target (no Host/SNI spoofing needed).
  secure: true,
  selfHandleResponse: true,
  on: {
    proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers["content-type"] || "";
      if (!contentType.includes("text/html")) return buffer;
      const html = buffer.toString("utf8");
      return rewriteHtml(html, { customDomain: req.customDomain });
    }),
  },
});

// Host-based routing: only known, verified custom domains get proxied through
// to the Base44 app. Anything else is rejected outright so this service can
// never be used as an open proxy.
async function storeProxy(req, res, next) {
  const domain = (req.headers.host || "").toLowerCase().split(":")[0];
  let doc;
  try {
    doc = await domains().findOne({ domain, is_active: true });
  } catch (err) {
    console.error("storeProxy lookup failed", err.message);
    return res.status(503).type("text/plain").send("Service temporarily unavailable.");
  }

  if (!doc) {
    return res.status(404).type("text/plain").send("This domain is not configured.");
  }

  req.customDomain = domain;
  req.storeSlug = doc.store_slug;
  return proxy(req, res, next);
}

module.exports = storeProxy;
