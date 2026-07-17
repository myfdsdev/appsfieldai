// ── Exclusive Store Styles ────────────────────────────────────────────────
// A "store style" is a full VISUAL identity — far more than a color pair.
// Each one defines its own font pairing, hero/header treatment, product card
// layout, grid density, corner rounding, and button shape, so the 5 styles
// feel like genuinely different websites built by different designers.
//
// Stored on marketplace.pageSections.storeStyle (a slug). Selectable at store
// setup AND changeable any time from the store's page settings.
//
// Fonts are loaded on demand by the store page (see loadStyleFonts) so we only
// pull in the families a given store actually uses.

export const STORE_STYLES = [
  {
    slug: "aurora",
    name: "Aurora",
    tagline: "Modern SaaS — clean, airy, gradient accents",
    // Fonts
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFonts: ["Space+Grotesk:wght@500;600;700", "Inter:wght@400;500;600"],
    // Full palette — deep indigo surface with violet accents.
    palette: {
      accent: "#8b5cf6",
      accentText: "#ffffff",
      surface: "#0b0d1a",
      card: "#12152a",
      cardBorder: "rgba(139,92,246,0.18)",
      text: "#e6e8f5",
    },
    // Hero
    hero: {
      size: "md",              // vertical padding preset
      align: "center",
      titleClass: "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight",
      gradientTitle: true,
      logoShape: "rounded-2xl",
      logoSize: "w-20 h-20",
      badgePill: true,
      ctaShape: "rounded-full",
    },
    // Products
    products: {
      layout: "card",          // SaaSCard variant
      columns: "sm:grid-cols-2 lg:grid-cols-3",
      gap: "gap-6",
      radius: "rounded-2xl",
      buttonShape: "rounded-lg",
      imageHeight: "h-36",
      cardBorder: "border border-[#8b5cf6]/20",
      cardBg: "bg-[#12152a]",
      cardHover: "hover:-translate-y-1 hover:border-[#8b5cf6]/60 hover:shadow-xl hover:shadow-[#8b5cf6]/20",
      titleClass: "font-bold text-base tracking-tight",
      uppercaseTitle: false,
    },
    // Section headings
    sectionTitleClass: "text-2xl sm:text-3xl font-bold tracking-tight",
    preview: { bg: "linear-gradient(135deg,#6d28d9,#06b6d4)", font: "'Space Grotesk',sans-serif" },
  },
  {
    slug: "monolith",
    name: "Monolith",
    tagline: "Classic & editorial — serif headlines, roomy layout",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    googleFonts: ["Playfair+Display:wght@500;600;700;800", "Source+Sans+3:wght@400;500;600"],
    // Full palette — dark editorial slate with an aged-gold accent.
    palette: {
      accent: "#d6b25e",
      accentText: "#141009",
      surface: "#0e1116",
      card: "#151a21",
      cardBorder: "rgba(214,178,94,0.22)",
      text: "#ece7df",
    },
    hero: {
      size: "lg",
      align: "left",
      titleClass: "text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]",
      gradientTitle: false,
      logoShape: "rounded-full",
      logoSize: "w-16 h-16",
      badgePill: false,
      ctaShape: "rounded-none",
    },
    products: {
      layout: "editorial",     // horizontal media-object rows
      columns: "lg:grid-cols-2",
      gap: "gap-8",
      radius: "rounded-none",
      buttonShape: "rounded-none",
      imageHeight: "h-full",
      cardBorder: "border border-[#d6b25e]/25",
      cardBg: "bg-[#151a21]",
      cardHover: "hover:border-[#d6b25e]/60",
      titleClass: "font-bold text-lg tracking-tight",
      uppercaseTitle: false,
    },
    sectionTitleClass: "text-3xl sm:text-4xl font-bold",
    preview: { bg: "linear-gradient(135deg,#1e293b,#0f172a)", font: "'Playfair Display',serif" },
  },
  {
    slug: "neon",
    name: "Neon Grid",
    tagline: "Bold & vibrant — big type, dense product grid",
    headingFont: "'Sora', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFonts: ["Sora:wght@600;700;800", "Inter:wght@400;500;600"],
    // Full palette — near-black with hot rose/neon accents.
    palette: {
      accent: "#f43f5e",
      accentText: "#ffffff",
      surface: "#0a0a0f",
      card: "#14101a",
      cardBorder: "rgba(244,63,94,0.28)",
      text: "#f2e9ec",
    },
    hero: {
      size: "xl",
      align: "center",
      titleClass: "text-5xl sm:text-6xl lg:text-8xl font-extrabold uppercase tracking-tighter leading-none",
      gradientTitle: true,
      logoShape: "rounded-2xl",
      logoSize: "w-24 h-24",
      badgePill: true,
      ctaShape: "rounded-xl",
    },
    products: {
      layout: "compact",       // tighter cards, 4-up grid
      columns: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      gap: "gap-4",
      radius: "rounded-xl",
      buttonShape: "rounded-xl",
      imageHeight: "h-28",
      cardBorder: "border-2 border-[#f43f5e]/30",
      cardBg: "bg-[#14101a]",
      cardHover: "hover:border-[#f43f5e] hover:shadow-[0_0_24px_-4px] hover:shadow-[#f43f5e]/50",
      titleClass: "font-extrabold text-base uppercase tracking-tight",
      uppercaseTitle: true,
    },
    sectionTitleClass: "text-3xl sm:text-4xl font-extrabold uppercase tracking-tight",
    preview: { bg: "linear-gradient(135deg,#f97316,#f43f5e)", font: "'Sora',sans-serif" },
  },
  {
    slug: "linen",
    name: "Nitro",
    tagline: "Bold NFT drop — heavy condensed caps, lime on near-black",
    // Anton = heavy condensed uppercase display, like the reference headline.
    headingFont: "'Anton', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFonts: ["Anton", "Inter:wght@400;500;600"],
    // Full color palette used across ALL sections (hero, cards, FAQs, footer, badges).
    palette: {
      accent: "#c5f82a",          // lime-yellow
      accentText: "#0a0f05",      // near-black text on lime buttons
      surface: "#0d1408",         // near-black green-tinted page bg
      card: "#141c0e",            // card surface
      cardBorder: "rgba(197,248,42,0.18)",
      text: "#e8f0df",
    },
    hero: {
      size: "xl",
      align: "center",
      titleClass: "text-5xl sm:text-6xl lg:text-7xl font-normal uppercase tracking-tight leading-[0.95]",
      gradientTitle: false,
      logoShape: "rounded-xl",
      logoSize: "w-14 h-14",
      badgePill: true,
      ctaShape: "rounded-full",
    },
    products: {
      layout: "card",
      columns: "sm:grid-cols-2 lg:grid-cols-3",
      gap: "gap-6",
      radius: "rounded-2xl",
      buttonShape: "rounded-full",
      imageHeight: "h-40",
      cardBorder: "border border-[#c5f82a]/15",
      cardBg: "bg-[#141c0e]",
      cardHover: "hover:border-[#c5f82a]/50 hover:shadow-[0_0_28px_-6px] hover:shadow-[#c5f82a]/30",
      titleClass: "font-normal text-lg uppercase tracking-wide",
      uppercaseTitle: true,
    },
    sectionTitleClass: "text-3xl sm:text-4xl font-normal uppercase tracking-tight",
    preview: { bg: "linear-gradient(135deg,#c5f82a,#0d1408)", font: "'Anton',sans-serif" },
  },
  {
    slug: "carbon",
    name: "Carbon",
    tagline: "Enterprise & sharp — structured, mono accents",
    headingFont: "'IBM Plex Sans', sans-serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    googleFonts: ["IBM+Plex+Sans:wght@400;500;600;700", "IBM+Plex+Mono:wght@500;600"],
    // Full palette — graphite enterprise surface with a sharp sky-blue accent.
    palette: {
      accent: "#38bdf8",
      accentText: "#06121c",
      surface: "#0b0f14",
      card: "#12181f",
      cardBorder: "rgba(56,189,248,0.18)",
      text: "#e2eaf0",
    },
    hero: {
      size: "md",
      align: "left",
      titleClass: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
      gradientTitle: false,
      logoShape: "rounded-lg",
      logoSize: "w-16 h-16",
      badgePill: false,
      ctaShape: "rounded-md",
    },
    products: {
      layout: "card",
      columns: "sm:grid-cols-2 lg:grid-cols-3",
      gap: "gap-5",
      radius: "rounded-lg",
      buttonShape: "rounded-md",
      imageHeight: "h-32",
      cardBorder: "border border-[#38bdf8]/20",
      cardBg: "bg-[#12181f]",
      cardHover: "hover:border-[#38bdf8]/60 hover:shadow-md",
      titleClass: "font-bold text-base tracking-tight",
      uppercaseTitle: false,
    },
    sectionTitleClass: "text-2xl sm:text-3xl font-bold tracking-tight",
    preview: { bg: "linear-gradient(135deg,#0f172a,#334155)", font: "'IBM Plex Sans',sans-serif" },
  },
];

export const DEFAULT_STORE_STYLE = "aurora";

export function getStoreStyle(slug) {
  return STORE_STYLES.find((s) => s.slug === slug) || STORE_STYLES[0];
}

// Hero vertical padding presets keyed by hero.size.
export const HERO_SIZE_PADDING = {
  sm: "py-12",
  md: "py-20",
  lg: "py-28",
  xl: "py-36",
};

// Inject the Google Fonts a given style needs (once per family). Safe to call
// repeatedly — it dedupes by href.
export function loadStyleFonts(style) {
  if (typeof document === "undefined" || !style?.googleFonts?.length) return;
  const href = `https://fonts.googleapis.com/css2?${style.googleFonts
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
  if (document.querySelector(`link[data-store-font="${style.slug}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-store-font", style.slug);
  document.head.appendChild(link);
}