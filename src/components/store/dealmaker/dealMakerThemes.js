// Preset background gradient themes for the immersive Deal Maker chat.
// `css` is a full CSS background value layered ABOVE the owner-controlled dim,
// so the actual theme color reads clearly. Bases are kept rich (not near-black)
// so the chosen color is always visible; the dim slider handles darkness.
export const DEAL_MAKER_BG_THEMES = [
  {
    key: "midnight",
    label: "Midnight",
    css: "radial-gradient(circle at 50% 30%, #1e3a5f 0%, #0f2038 45%, #070d1a 100%)",
    swatch: "linear-gradient(135deg, #1e3a5f, #070d1a)",
  },
  {
    key: "aurora",
    label: "Aurora",
    css: "linear-gradient(135deg, #12386e 0%, #0f4a5c 45%, #0a4d3f 100%)",
    swatch: "linear-gradient(135deg, #1d4ed8, #059669)",
  },
  {
    key: "sunset",
    label: "Sunset",
    css: "linear-gradient(135deg, #7a1f3d 0%, #9a3412 55%, #451a08 100%)",
    swatch: "linear-gradient(135deg, #f97316, #db2777)",
  },
  {
    key: "violet",
    label: "Violet Dusk",
    css: "linear-gradient(135deg, #3b2470 0%, #4c1d95 50%, #1e1240 100%)",
    swatch: "linear-gradient(135deg, #7c3aed, #22d3ee)",
  },
  {
    key: "emerald",
    label: "Emerald",
    css: "linear-gradient(135deg, #0a4a38 0%, #0e6b4d 55%, #073024 100%)",
    swatch: "linear-gradient(135deg, #10b981, #0ea5e9)",
  },
  {
    key: "mono",
    label: "Charcoal",
    css: "linear-gradient(135deg, #3a3a3f 0%, #232326 60%, #141416 100%)",
    swatch: "linear-gradient(135deg, #3f3f46, #18181b)",
  },
  {
    key: "ocean",
    label: "Deep Ocean",
    css: "radial-gradient(circle at 30% 20%, #1c5a86 0%, transparent 60%), radial-gradient(circle at 80% 80%, #0e6b7a 0%, transparent 60%), linear-gradient(160deg, #0a2a44, #06182b 100%)",
    swatch: "linear-gradient(135deg, #0369a1, #06b6d4)",
  },
  {
    key: "cosmic",
    label: "Cosmic",
    css: "radial-gradient(circle at 25% 30%, #6d28d9 0%, transparent 55%), radial-gradient(circle at 75% 65%, #2563eb 0%, transparent 55%), linear-gradient(140deg, #1e1147, #0f0a24 100%)",
    swatch: "linear-gradient(135deg, #a855f7, #3b82f6)",
  },
  {
    key: "ember",
    label: "Ember",
    css: "radial-gradient(circle at 50% 100%, #c2410c 0%, transparent 65%), radial-gradient(circle at 20% 10%, #831843 0%, transparent 60%), linear-gradient(180deg, #451a09, #1c0a06 100%)",
    swatch: "linear-gradient(135deg, #ea580c, #b91c1c)",
  },
  {
    key: "mint",
    label: "Mint Frost",
    css: "radial-gradient(circle at 70% 20%, #0f766e 0%, transparent 60%), radial-gradient(circle at 20% 80%, #155e75 0%, transparent 60%), linear-gradient(150deg, #0a3d3a, #06231f 100%)",
    swatch: "linear-gradient(135deg, #2dd4bf, #22d3ee)",
  },
  {
    key: "rose",
    label: "Rose Noir",
    css: "radial-gradient(circle at 30% 25%, #9d174d 0%, transparent 60%), radial-gradient(circle at 80% 75%, #6d28d9 0%, transparent 60%), linear-gradient(155deg, #3a0f28, #170714 100%)",
    swatch: "linear-gradient(135deg, #f43f5e, #a855f7)",
  },
  {
    key: "gold",
    label: "Golden Hour",
    css: "radial-gradient(circle at 50% 15%, #a16207 0%, transparent 60%), radial-gradient(circle at 30% 90%, #9a3412 0%, transparent 60%), linear-gradient(170deg, #3a2a08, #1a1205 100%)",
    swatch: "linear-gradient(135deg, #eab308, #f97316)",
  },
  {
    key: "steel",
    label: "Steel Blue",
    css: "conic-gradient(from 210deg at 50% 40%, #334155, #1e293b, #2563eb, #1e293b, #334155)",
    swatch: "conic-gradient(from 210deg, #334155, #1e3a8a, #334155)",
  },
];

export function getDealMakerBgTheme(key) {
  return DEAL_MAKER_BG_THEMES.find((t) => t.key === key) || DEAL_MAKER_BG_THEMES[0];
}