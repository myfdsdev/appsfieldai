import React from "react";
import { Check } from "lucide-react";
import { STORE_STYLES } from "./storeStyles";

// Visual picker for the 5 exclusive store styles. Each tile renders a tiny
// live mock (font + header + product blocks) so the difference is obvious.
// Used at store setup and in the store's page settings (change any time).
export default function StoreStylePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {STORE_STYLES.map((s) => {
        const selected = value === s.slug;
        return (
          <button
            key={s.slug}
            type="button"
            onClick={() => onChange(s.slug)}
            className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${
              selected ? "border-violet-500 ring-2 ring-violet-500/30" : "border-border/40 hover:border-border"
            }`}
          >
            {selected && (
              <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}

            {/* Mini mock */}
            <div className="p-3 pb-0" style={{ background: s.preview.bg }}>
              <div className="rounded-t-lg bg-white/95 p-3">
                <div
                  className="text-[13px] font-bold text-neutral-900 leading-tight"
                  style={{ fontFamily: s.preview.font, textAlign: s.hero.align === "left" ? "left" : "center" }}
                >
                  {s.name}
                </div>
                <div
                  className="text-[8px] text-neutral-500 mt-0.5"
                  style={{ textAlign: s.hero.align === "left" ? "left" : "center" }}
                >
                  Your headline goes here
                </div>
                {/* product blocks reflecting the layout */}
                <div
                  className={`mt-2 grid ${
                    s.products.layout === "editorial"
                      ? "grid-cols-1"
                      : s.products.layout === "compact"
                      ? "grid-cols-4"
                      : "grid-cols-3"
                  } gap-1`}
                >
                  {Array.from({ length: s.products.layout === "editorial" ? 2 : s.products.layout === "compact" ? 4 : 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`bg-neutral-200 ${
                        s.products.radius === "rounded-none"
                          ? "rounded-none"
                          : s.products.radius === "rounded-3xl"
                          ? "rounded-lg"
                          : "rounded"
                      } ${s.products.layout === "editorial" ? "h-4" : "h-6"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-card">
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.tagline}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}