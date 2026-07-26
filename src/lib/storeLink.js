// Builds the best public URL for a store (Marketplace record).
// Prefers a connected custom domain, then the platform subdomain, then the
// in-app /store/:slug route. Falls back to a stored storeLink if present.
const PLATFORM_DOMAIN = "app.appsfieldai.com";

export function buildStoreLink(store) {
  if (!store) return "";
  if (store.customDomain) {
    const d = store.customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${d}`;
  }
  if (store.subdomain) {
    return `https://${store.subdomain}.${PLATFORM_DOMAIN}`;
  }
  if (store.storeLink) return store.storeLink;
  if (store.slug) {
    return `${window.location.origin}/store/${store.slug}`;
  }
  return "";
}