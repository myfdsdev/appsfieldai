const axios = require("axios");

const CACHE_TTL_MS = 60_000;
const cache = new Map(); // customDomain -> { marketplace, expires }

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchMarketplace(customDomain) {
  const cached = cache.get(customDomain);
  if (cached && cached.expires > Date.now()) return cached.marketplace;

  const base = process.env.BASE44_FUNCTIONS_ORIGIN;
  const res = await axios.post(
    `${base}/functions/getMarketplacePublic`,
    { customDomain },
    { timeout: 8000 }
  );
  const marketplace = res.data?.marketplace || null;
  cache.set(customDomain, { marketplace, expires: Date.now() + CACHE_TTL_MS });
  return marketplace;
}

// Rewrites <title>, canonical, and Open Graph tags in a proxied HTML shell so
// crawlers/social previews see the custom domain and the store's own branding,
// not the generic Base44 app shell. Fails open (returns html unchanged) on any
// error — SEO tags are an enhancement, not something that should break a request.
async function rewriteHtml(html, { customDomain }) {
  try {
    const marketplace = await fetchMarketplace(customDomain);
    if (!marketplace) return html;

    const title = marketplace.name || "Store";
    const desc = marketplace.settings?.seoDescription || marketplace.description || "";
    const logo = marketplace.branding?.logo || "";
    const canonical = `https://${customDomain}/`;

    let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

    const metaTags = [
      `<meta name="description" content="${escapeHtml(desc)}" />`,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(desc)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      logo ? `<meta property="og:image" content="${escapeHtml(logo)}" />` : "",
    ]
      .filter(Boolean)
      .join("\n    ");

    out = out.replace(/<\/head>/i, `    ${metaTags}\n  </head>`);
    return out;
  } catch (err) {
    console.error("htmlRewrite failed, serving unmodified HTML", err.message);
    return html;
  }
}

module.exports = { rewriteHtml };
