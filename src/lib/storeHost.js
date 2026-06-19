// Detects whether the app is being served from a customer store subdomain
// (e.g. mystore.platform.com via a wildcard DNS record) and returns the store key.
// Returns null when on the main app host (apex, www, base44 infra, localhost, IPs).

const INFRA_LABELS = ["www", "app", "admin", "api", "staging", "preview"];

// The platform's own main domain. Hosts ending in this are the main app, NOT a customer store.
// Change this if your primary app domain changes.
const PLATFORM_DOMAIN = "nanomagicai.com";

function isInfraHost(host) {
  return (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes("base44.app") ||
    host.includes("base44.dev")
  );
}

export function getStoreKeyFromHost(hostname = window.location.hostname) {
  const host = (hostname || "").toLowerCase().trim();
  if (isInfraHost(host)) return null;

  const parts = host.split(".");
  // Need at least sub.domain.tld for a subdomain to exist.
  if (parts.length < 3) return null;

  const label = parts[0];
  if (INFRA_LABELS.includes(label)) return null;

  return label;
}

// Returns the full host when the app is loaded on a customer's OWN custom domain
// (anything that isn't the platform domain or infra). Used to resolve the store by customDomain.
// Returns null on the main app domain / infra / localhost.
export function getCustomDomainFromHost(hostname = window.location.hostname) {
  const host = (hostname || "").toLowerCase().trim();
  if (isInfraHost(host)) return null;

  // Strip leading "www." for comparison.
  const bare = host.replace(/^www\./, "");

  // On the platform's own domain (apex or any *.nanomagicai.com subdomain) → not a custom domain.
  if (bare === PLATFORM_DOMAIN || bare.endsWith(`.${PLATFORM_DOMAIN}`)) return null;

  return bare;
}