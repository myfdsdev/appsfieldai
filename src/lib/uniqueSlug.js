import { base44 } from "@/api/base44Client";

// Turn any text into a URL-friendly slug.
export function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Ensure a marketplace slug is globally unique. If the desired slug is already
// taken, append -2, -3, ... until a free one is found.
// `excludeId` lets an existing store keep its own slug when re-checked.
export async function ensureUniqueMarketplaceSlug(desiredSlug, excludeId = null) {
  const base = slugify(desiredSlug) || "store";
  let candidate = base;
  let n = 1;
  // Loop until no OTHER marketplace uses the candidate slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const matches = await base44.entities.Marketplace.filter({ slug: candidate });
    const taken = matches.some((m) => m.id !== excludeId);
    if (!taken) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}