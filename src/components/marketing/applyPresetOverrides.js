import { base44 } from "@/api/base44Client";

// Merges admin-configured MarketingPresetOverride records onto the built-in
// presets: custom label, base prompt and thumbnail win when set.
// Returns { presets, thumbs } — thumbs is a {presetId: url} map of custom
// thumbnails (used to seed the Studio thumbnail cache).
export async function applyPresetOverrides(presets, mediaType) {
  let overrides = [];
  try {
    overrides = await base44.entities.MarketingPresetOverride.filter({ mediaType });
  } catch {
    overrides = [];
  }
  const byId = {};
  overrides.forEach((o) => { if (o.presetId) byId[o.presetId] = o; });

  const thumbs = {};
  const merged = presets.map((p) => {
    const o = byId[p.id];
    if (!o) return p;
    if (o.thumbnailUrl) thumbs[p.id] = o.thumbnailUrl;
    return {
      ...p,
      label: o.label?.trim() || p.label,
      prompt: o.prompt?.trim() || p.prompt,
    };
  });

  return { presets: merged, thumbs };
}