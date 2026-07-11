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
];

export function getDealMakerBgTheme(key) {
  return DEAL_MAKER_BG_THEMES.find((t) => t.key === key) || DEAL_MAKER_BG_THEMES[0];
}