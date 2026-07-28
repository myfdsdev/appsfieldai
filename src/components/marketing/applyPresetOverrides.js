import { base44 } from "@/api/base44Client";

// Merges admin-configured MarketingPresetOverride records onto the built-in
// presets: custom label, base prompt and thumbnail win when set. Admin-created
// custom presets (isCustom) are appended after the built-ins.
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

  // Append fully admin-created custom presets (not tied to a built-in id).
  const builtinIds = new Set(presets.map((p) => p.id));
  overrides
    .filter((o) => o.isCustom && !builtinIds.has(o.presetId))
    .forEach((o) => {
      if (o.thumbnailUrl) thumbs[o.presetId] = o.thumbnailUrl;
      merged.push({
        id: o.presetId,
        label: o.label?.trim() || "Custom Template",
        emoji: o.emoji || "🎨",
        prompt: o.prompt?.trim() || "",
      });
    });

  return { presets: merged, thumbs };
}