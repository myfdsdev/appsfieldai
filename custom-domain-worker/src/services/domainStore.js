// KV access layer for hostname → tenant mappings.
// Key: the bare hostname (e.g. "shop.customerdomain.com"). Value: JSON record.

export async function getDomain(env, hostname) {
  const raw = await env.DOMAINS.get(hostname);
  return raw ? JSON.parse(raw) : null;
}

export async function putDomain(env, hostname, data) {
  await env.DOMAINS.put(hostname, JSON.stringify(data));
  // Secondary index so we can resolve a tenant's active domain by store slug
  // (used by the storefront redirect check). Optional field.
  if (data.storeSlug) await env.DOMAINS.put(`slug:${data.storeSlug}`, hostname);
}

export async function deleteDomain(env, hostname) {
  const existing = await getDomain(env, hostname);
  await env.DOMAINS.delete(hostname);
  if (existing && existing.storeSlug) await env.DOMAINS.delete(`slug:${existing.storeSlug}`);
}

export async function domainExists(env, hostname) {
  return (await env.DOMAINS.get(hostname)) !== null;
}

// Resolve the active custom domain for a store slug (redirect helper).
export async function domainForSlug(env, slug) {
  const hostname = await env.DOMAINS.get(`slug:${slug}`);
  if (!hostname) return null;
  return getDomain(env, hostname);
}
