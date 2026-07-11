// Preset background gradient themes for the immersive Deal Maker chat.
// `css` is a full CSS background value layered UNDER the owner-controlled dim.
export const DEAL_MAKER_BG_THEMES = [
  {
    key: "midnight",
    label: "Midnight",
    css: "radial-gradient(circle at 50% 35%, #0f172a, #05070c 70%)",
    swatch: "linear-gradient(135deg, #0f172a, #05070c)",
  },
  {
    key: "aurora",
    label: "Aurora",
    css: "linear-gradient(135deg, #0b1e3f 0%, #10233f 40%, #05221f 100%)",
    swatch: "linear-gradient(135deg, #1d4ed8, #059669)",
  },
  {
    key: "sunset",
    label: "Sunset",
    css: "linear-gradient(135deg, #2a0a1e 0%, #3b1207 55%, #1a0a05 100%)",
    swatch: "linear-gradient(135deg, #f97316, #db2777)",
  },
  {
    key: "violet",
    label: "Violet Dusk",
    css: "linear-gradient(135deg, #1e103a 0%, #2b1155 50%, #0b0716 100%)",
    swatch: "linear-gradient(135deg, #7c3aed, #22d3ee)",
  },
  {
    key: "emerald",
    label: "Emerald",
    css: "linear-gradient(135deg, #04231b 0%, #063f2e 55%, #041410 100%)",
    swatch: "linear-gradient(135deg, #10b981, #0ea5e9)",
  },
  {
    key: "mono",
    label: "Charcoal",
    css: "linear-gradient(135deg, #1c1c1e 0%, #101012 60%, #050506 100%)",
    swatch: "linear-gradient(135deg, #3f3f46, #18181b)",
  },
  {
    key: "ocean",
    label: "Deep Ocean",
    css: "radial-gradient(circle at 30% 20%, #0e2a47 0%, transparent 55%), radial-gradient(circle at 80% 80%, #0a3d4a 0%, transparent 55%), linear-gradient(160deg, #04101f, #020609 100%)",
    swatch: "linear-gradient(135deg, #0369a1, #06b6d4)",
  },
  {
    key: "cosmic",
    label: "Cosmic",
    css: "radial-gradient(circle at 25% 30%, #3b0764 0%, transparent 50%), radial-gradient(circle at 75% 65%, #1e3a8a 0%, transparent 50%), linear-gradient(140deg, #0b0518, #04030a 100%)",
    swatch: "linear-gradient(135deg, #a855f7, #3b82f6)",
  },
  {
    key: "ember",
    label: "Ember",
    css: "radial-gradient(circle at 50% 100%, #7c2d12 0%, transparent 60%), radial-gradient(circle at 20% 10%, #4c0519 0%, transparent 55%), linear-gradient(180deg, #1a0a05, #050202 100%)",
    swatch: "linear-gradient(135deg, #ea580c, #b91c1c)",
  },
  {
    key: "mint",
    label: "Mint Frost",
    css: "radial-gradient(circle at 70% 20%, #0f3d3a 0%, transparent 55%), radial-gradient(circle at 20% 80%, #164e63 0%, transparent 55%), linear-gradient(150deg, #05201f, #03100f 100%)",
    swatch: "linear-gradient(135deg, #2dd4bf, #22d3ee)",
  },
  {
    key: "rose",
    label: "Rose Noir",
    css: "radial-gradient(circle at 30% 25%, #4c0d2e 0%, transparent 55%), radial-gradient(circle at 80% 75%, #3b0764 0%, transparent 55%), linear-gradient(155deg, #170510, #060207 100%)",
    swatch: "linear-gradient(135deg, #f43f5e, #a855f7)",
  },
  {
    key: "gold",
    label: "Golden Hour",
    css: "radial-gradient(circle at 50% 15%, #4d3308 0%, transparent 55%), radial-gradient(circle at 30% 90%, #5b210a 0%, transparent 55%), linear-gradient(170deg, #1a1205, #060402 100%)",
    swatch: "linear-gradient(135deg, #eab308, #f97316)",
  },
  {
    key: "steel",
    label: "Steel Blue",
    css: "conic-gradient(from 210deg at 50% 40%, #1e293b, #0f172a, #1e3a8a, #0f172a, #1e293b)",
    swatch: "conic-gradient(from 210deg, #334155, #1e3a8a, #334155)",
  },
];

export function getDealMakerBgTheme(key) {
  return DEAL_MAKER_BG_THEMES.find((t) => t.key === key) || DEAL_MAKER_BG_THEMES[0];
}