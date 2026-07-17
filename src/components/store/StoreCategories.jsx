import React from "react";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";

// Category chip strip for a store page — combines the store's saved categories
// (created at setup or in the Categories manager) with any used by listings.
export default function StoreCategories({ listings = [], savedCategories = [], brandColor = "#f97316", styleSlug, onSelect }) {
  const style = getStoreStyle(styleSlug);
  const pal = style.palette;
  const accent = pal?.accent || brandColor;

  const savedNames = savedCategories.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean);
  const listingNames = listings.map((l) => l.category).filter(Boolean);
  const categories = Array.from(new Set([...savedNames, ...listingNames]));

  if (categories.length === 0) return null;

  // Count how many listings sit in each category so chips can show a live count.
  const countFor = (cat) => listings.filter((l) => l.category === cat).length;

  return (
    <section id="store-categories" className="max-w-7xl mx-auto px-6 py-10">
      <div
        className="rounded-3xl p-6 sm:p-8 border"
        style={{
          background: pal ? pal.card : "hsl(var(--card))",
          borderColor: pal ? pal.cardBorder : "hsl(var(--border) / 0.4)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: accent }}
          >
            <LayoutGrid className="w-5 h-5" style={{ color: pal?.accentText || "#fff" }} />
          </div>
          <div>
            <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>
              Browse by Category
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: style.bodyFont }}>
              Find the perfect deal in your niche
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onSelect?.(null)}
            className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
            style={{ background: `${accent}14`, borderColor: `${accent}55` }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ fontFamily: style.headingFont, color: accent }}>All Deals</p>
              <p className="text-[11px] text-muted-foreground">{listings.length} {listings.length === 1 ? "deal" : "deals"}</p>
            </div>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: accent, color: pal?.accentText || "#fff" }}
            >
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          {categories.map((cat) => {
            const n = countFor(cat);
            return (
              <button
                key={cat}
                onClick={() => onSelect?.(cat)}
                className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: pal ? pal.surface : "hsl(var(--secondary) / 0.4)",
                  borderColor: pal ? pal.cardBorder : "hsl(var(--border) / 0.4)",
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ fontFamily: style.headingFont }}>{cat}</p>
                  {n > 0 && (
                    <p className="text-[11px] text-muted-foreground">{n} {n === 1 ? "deal" : "deals"}</p>
                  )}
                </div>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: `${accent}1a`, color: accent }}
                >
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}