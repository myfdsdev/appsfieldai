import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SaaSCard from "@/components/marketplace/SaaSCard";
import StoreEditorialCard from "@/components/store/StoreEditorialCard";
import NexusProductCard from "@/components/store/NexusProductCard";
import AppsfieldProductCard from "@/components/store/AppsfieldProductCard";
import { getStoreStyle } from "@/components/store/storeStyles";

const STORE_DEFAULTS = { title: "Once In A Lifetime Deals", subtitle: "Exclusive lifetime offers from this store" };

export default function OneInALifetimeDeals({ listings = [], title, subtitle, styleSlug, currency = "USD", onViewDetails, onReserveSpot, onAddToCart, onBuyNow, affiliateLinkFor, searchQuery, onSearchChange }) {
  const [internalSearch, setInternalSearch] = useState("");
  // Controlled when a searchQuery prop is supplied (e.g. from the navbar search); otherwise self-managed.
  const isControlled = searchQuery !== undefined;
  const search = isControlled ? searchQuery : internalSearch;
  const setSearch = (v) => (isControlled ? onSearchChange?.(v) : setInternalSearch(v));
  const style = getStoreStyle(styleSlug);
  // Merge the style's fonts + palette accent into the product spec so cards can apply them.
  const p = { ...style.products, headingFont: style.headingFont, bodyFont: style.bodyFont, accent: style.palette?.accent, accentText: style.palette?.accentText };

  const filtered = listings.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const haystack = [
      l.softwareName,
      l.shortDescription,
      l.fullDescription,
      l.category,
      ...(Array.isArray(l.features) ? l.features : []),
      ...(Array.isArray(l.tags) ? l.tags : []),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });

  const isEditorial = p.layout === "editorial";
  const isNexus = p.layout === "nexus";
  const isAppsfield = p.layout === "appsfield";
  const accent = style.palette?.accent;

  // Reference-style headline: last word highlighted in the style's accent color.
  const fullTitle = (title?.trim() || STORE_DEFAULTS.title);
  const words = fullTitle.split(" ");
  const lastWord = words.length > 1 ? words.pop() : null;
  const leadWords = words.join(" ");

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <p
          className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-3"
          style={{ color: accent || "#a78bfa", fontFamily: style.bodyFont }}
        >
          {subtitle?.trim() || STORE_DEFAULTS.subtitle}
        </p>
        <h2 className={`${style.sectionTitleClass} max-w-3xl mx-auto text-balance`} style={{ fontFamily: style.headingFont }}>
          {lastWord ? (
            <>
              {leadWords}{" "}
              <span style={{ color: accent || undefined }} className={accent ? "" : "text-primary"}>{lastWord}</span>
            </>
          ) : (
            fullTitle
          )}
        </h2>
        <div className="relative w-full sm:w-80 mx-auto mt-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deals..."
            className={`rounded-full pl-9 ${accent ? "border" : "bg-secondary/50 border-border/30"}`}
            style={accent ? { background: style.palette.card, borderColor: style.palette.cardBorder } : undefined}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No deals match "{search}".</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${p.columns} ${p.gap}`}>
          {filtered.map((l, i) =>
            isAppsfield ? (
              <AppsfieldProductCard
                key={l.id}
                listing={l}
                delay={i * 0.04}
                currency={currency}
                onViewDetails={onViewDetails}
                onReserveSpot={onReserveSpot || onViewDetails}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                affiliateLink={affiliateLinkFor?.(l)}
              />
            ) : isNexus ? (
              <NexusProductCard
                key={l.id}
                listing={l}
                delay={i * 0.04}
                currency={currency}
                onViewDetails={onViewDetails}
                onReserveSpot={onReserveSpot || onViewDetails}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                affiliateLink={affiliateLinkFor?.(l)}
              />
            ) : isEditorial ? (
              <StoreEditorialCard
                key={l.id}
                listing={l}
                delay={i * 0.04}
                styleSpec={p}
                currency={currency}
                onViewDetails={onViewDetails}
                onReserveSpot={onReserveSpot || onViewDetails}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                affiliateLink={affiliateLinkFor?.(l)}
              />
            ) : (
              <SaaSCard
                key={l.id}
                listing={l}
                delay={i * 0.04}
                styleSpec={p}
                onViewDetails={onViewDetails}
                onBuySpot={onViewDetails}
                onReserveSpot={onReserveSpot || onViewDetails}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                affiliateLink={affiliateLinkFor?.(l)}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}