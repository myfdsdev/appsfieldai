// Theme color configuration shared between the ThemeProvider (applies colors)
// and the admin Theme Colors editor (edits them). Colors are stored as HEX in
// the AppConfig entity (key: "theme_colors") and converted to the HSL triplets
// that the Tailwind design tokens in index.css expect.

export const THEME_CONFIG_KEY = "theme_colors";

// Editable color tokens. Each maps to a --css-var consumed by tailwind.config.js.
// We keep the list focused on the colors that visibly define the look.
export const COLOR_TOKENS = [
  { token: "background", cssVar: "--background", label: "Background" },
  { token: "foreground", cssVar: "--foreground", label: "Text" },
  { token: "card", cssVar: "--card", label: "Card" },
  { token: "primary", cssVar: "--primary", label: "Primary" },
  { token: "secondary", cssVar: "--secondary", label: "Secondary" },
  { token: "muted", cssVar: "--muted", label: "Muted" },
  { token: "accent", cssVar: "--accent", label: "Accent" },
  { token: "border", cssVar: "--border", label: "Border" },
];

// Defaults mirror the values in src/index.css (converted to hex), so the editor
// starts from the current look and "Reset" restores it.
export const DEFAULT_COLORS = {
  light: {
    background: "#fbf9f7",
    foreground: "#1c1714",
    card: "#ffffff",
    primary: "#f97316",
    secondary: "#f0ece8",
    muted: "#f0ece8",
    accent: "#f59e0b",
    border: "#e3ddd6",
  },
  dark: {
    background: "#0d0b0a",
    foreground: "#f5f3f0",
    card: "#161312",
    primary: "#f97316",
    secondary: "#211d1b",
    muted: "#211d1b",
    accent: "#f59e0b",
    border: "#252120",
  },
};

// Convert "#rrggbb" -> "h s% l%" (the space-separated HSL triplet Tailwind tokens use).
export function hexToHslString(hex) {
  if (!hex) return null;
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply a set of hex colors for a given mode onto the document root as CSS vars.
export function applyThemeColors(colors, mode) {
  if (typeof document === "undefined" || !colors) return;
  const set = colors[mode];
  if (!set) return;
  const root = document.documentElement;
  COLOR_TOKENS.forEach(({ token, cssVar }) => {
    const hsl = hexToHslString(set[token]);
    if (hsl) {
      root.style.setProperty(cssVar, hsl);
      // Keep card-foreground / popover in sync with the text color for readability.
      if (token === "foreground") {
        root.style.setProperty("--card-foreground", hsl);
        root.style.setProperty("--popover-foreground", hsl);
      }
      if (token === "card") root.style.setProperty("--popover", hsl);
    }
  });
}