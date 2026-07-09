// Hostname validation + normalization for customer custom domains.

// Normalize any user input to a bare lowercase hostname:
//   "HTTPS://Shop.Domain.com/"  →  "shop.domain.com"
export function normalizeHostname(input) {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "") // strip scheme
    .replace(/\/.*$/, "")         // strip path
    .replace(/:\d+$/, "")         // strip port
    .replace(/\.$/, "")           // strip trailing dot
    .trim();
}

// A syntactically valid public hostname: labels of [a-z0-9-] joined by dots,
// at least two labels, no leading/trailing hyphens, total length sane.
export function isValidHostname(hostname) {
  if (!hostname || hostname.length > 253) return false;
  if (!/^[a-z0-9.-]+$/.test(hostname)) return false;
  const labels = hostname.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (l) => l.length >= 1 && l.length <= 63 && !l.startsWith("-") && !l.endsWith("-")
  );
}

// True if the hostname is a root/apex domain (exactly two labels, e.g. brand.com).
// Apex domains can't use a plain CNAME — flag so the UI can warn.
export function isApexDomain(hostname) {
  return hostname.split(".").length === 2;
}

// Reject AppsfieldAI's own domains — customers must not "claim" internal hosts.
export function isInternalDomain(hostname, env) {
  const internal = ["appsfieldai.com", "onrender.com", "base44.app", "base44.dev", "workers.dev"];
  const cname = normalizeHostname(env && env.CNAME_TARGET);
  if (cname && (hostname === cname || hostname.endsWith(`.${cname}`))) return true;
  return internal.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}
