// Builds a concise text summary of a store's page content, used as context for
// the AI prompt enhancer so generated ads reference the real product.
export function buildStoreContext(store) {
  if (!store) return "";
  const ps = store.pageSections || {};
  const lines = [];
  if (store.name) lines.push(`Store name: ${store.name}`);
  if (store.description) lines.push(`About: ${store.description}`);
  if (ps.headerTitle) lines.push(`Hero title: ${ps.headerTitle}`);
  if (ps.headerSubtitle) lines.push(`Hero subtitle: ${ps.headerSubtitle}`);
  if (ps.heroBadgeText) lines.push(`Badge: ${ps.heroBadgeText}`);
  if (ps.productsSectionTitle) lines.push(`Products section: ${ps.productsSectionTitle}`);
  if (ps.productsSectionSubtitle) lines.push(ps.productsSectionSubtitle);
  if (Array.isArray(store.categories) && store.categories.length) {
    lines.push(`Categories: ${store.categories.join(", ")}`);
  }
  if (ps.dealMakerNiche) lines.push(`Target audience: ${ps.dealMakerNiche}`);
  if (ps.dealMakerKnowledge) lines.push(`Notes: ${ps.dealMakerKnowledge}`);
  if (Array.isArray(ps.faqs) && ps.faqs.length) {
    lines.push(`FAQs: ${ps.faqs.slice(0, 3).map((f) => f.question).join(" | ")}`);
  }
  return lines.join("\n").slice(0, 2500);
}