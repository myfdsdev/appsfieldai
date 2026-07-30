import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Eye, X, Lock, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { STORE_STYLES } from "./storeStyles";

// Visual picker for the exclusive store themes. Each tile renders a tiny live
// mock (font + header + product blocks) plus a "Preview" button that opens a
// full-width, scrollable popup of the theme's full-page screenshot (managed by
// the admin under Marketplace Preset → Marketplace Templates).
// `allowedSlugs` (optional): list of theme slugs this plan can use. When empty
// or omitted, every theme is allowed. Locked themes are shown but can't be
// selected, with an upgrade hint.
export default function StoreStylePicker({ value, onChange, allowedSlugs }) {
  const [preview, setPreview] = useState(null); // { name, url }
  const hasRestriction = Array.isArray(allowedSlugs) && allowedSlugs.length > 0;
  const isLocked = (slug) => hasRestriction && !allowedSlugs.includes(slug);

  // Cached app-wide so theme thumbnails are fetched once and reused across
  // navigations — no flash/reload each time the Store Theme tab is opened.
  const { data: defaultRows, isLoading } = useQuery({
    queryKey: ["storeThemeDefaults"],
    queryFn: () => base44.entities.StorePageDefault.filter({ key: "default" }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const thumbnails = defaultRows?.[0]?.themeThumbnails || {};
  const names = defaultRows?.[0]?.themeNames || {};

  // While the cached thumbnails load for the first time, show skeleton tiles
  // instead of flashing the fallback mini-mocks.
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STORE_STYLES.map((s) => (
          <div key={s.slug} className="rounded-2xl border-2 border-border/40 overflow-hidden">
            <div className="w-full aspect-[16/9] bg-secondary/40 animate-pulse" />
            <div className="p-3 bg-card">
              <div className="h-4 w-24 bg-secondary/60 rounded animate-pulse" />
              <div className="h-3 w-40 bg-secondary/40 rounded animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STORE_STYLES.map((s) => {
          const selected = value === s.slug;
          const thumb = thumbnails[s.slug];
          const displayName = names[s.slug] || s.name;
          const locked = isLocked(s.slug);
          return (
            <div
              key={s.slug}
              className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${
                selected ? "border-violet-500 ring-2 ring-violet-500/30" : "border-border/40 hover:border-border"
              } ${locked ? "opacity-60" : ""}`}
            >
              {locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/45 backdrop-blur-[1px]">
                  <span className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"><Lock className="w-4 h-4" /></span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300"><Crown className="w-3 h-3" /> Upgrade to unlock</span>
                </div>
              )}
              {selected && !locked && (
                <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}

              <button type="button" onClick={() => !locked && onChange(s.slug)} disabled={locked} className={`block w-full text-left ${locked ? "cursor-not-allowed" : ""}`}>
                {thumb ? (
                  /* Actual thumbnail — top-aligned so the header part is visible */
                  <div className="w-full aspect-[16/9] overflow-hidden bg-neutral-900">
                    <img
                      src={thumb}
                      alt={`${displayName} preview`}
                      className="w-full h-auto block object-top"
                    />
                  </div>
                ) : (
                  /* Fallback mini mock when no screenshot uploaded */
                  <div className="p-3 pb-0" style={{ background: s.preview.bg }}>
                    <div className="rounded-t-lg bg-white/95 p-3">
                      <div
                        className="text-[13px] font-bold text-neutral-900 leading-tight"
                        style={{ fontFamily: s.preview.font, textAlign: s.hero.align === "left" ? "left" : "center" }}
                      >
                        {displayName}
                      </div>
                      <div
                        className="text-[8px] text-neutral-500 mt-0.5"
                        style={{ textAlign: s.hero.align === "left" ? "left" : "center" }}
                      >
                        Your headline goes here
                      </div>
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
                )}
              </button>

              <div className="p-3 bg-card flex items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.tagline}</p>
                </div>
                {thumb && (
                  <button
                    type="button"
                    onClick={() => setPreview({ name: displayName, url: thumb })}
                    className="shrink-0 inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-medium hover:bg-violet-500/25 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-width scrollable preview popup */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col"
          onClick={() => setPreview(null)}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-white">{preview.name} — Full Preview</p>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={`${preview.name} preview`} className="w-full block" />
          </div>
        </div>
      )}
    </>
  );
}