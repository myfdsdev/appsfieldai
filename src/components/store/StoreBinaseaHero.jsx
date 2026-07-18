import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import SaaSCard from "@/components/marketplace/SaaSCard";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";

const DEALS_DEFAULTS = { title: "Exclusive Deals 🔥", subtitle: "Grab these before the timer runs out" };

// ── Binasea-style hero ────────────────────────────────────────────────────
// Centered headline + subheadline + two CTAs on top, then a two-column band:
// a large character image on the LEFT and the "Exclusive Deals" product cards
// on the RIGHT — the real store SaaSCard, shown one at a time with a slider.
export default function StoreBinaseaHero({ marketplace, sections = {}, listings = [], currency = "USD", onViewDetails, onReserveSpot, onAddToCart, onBuyNow, affiliateLinkFor }) {
  const style = getStoreStyle(sections.storeStyle);
  const h = style.hero;
  const pal = style.palette;
  const accent = pal?.accent || marketplace.branding?.primaryColor || "#5142fc";
  const accentText = pal?.accentText || "#ffffff";
  const styleSpec = { ...style.products, headingFont: style.headingFont, bodyFont: style.bodyFont, accent, accentText };

  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Join group deals on premium software. Lock a slot, split the cost, and save big.";
  const sideImage = sections.heroSideImageUrl;

  // Same deal set as the Exclusive Deals section: time-limited deals, soonest first.
  const deals = listings
    .filter((l) => !l.noDayLimit && l.dealEndDate && new Date(l.dealEndDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.dealEndDate) - new Date(b.dealEndDate))
    .slice(0, 6);

  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [deals.length]);
  React.useEffect(() => {
    if (paused || deals.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % deals.length), 4500);
    return () => clearInterval(t);
  }, [paused, deals.length]);

  const current = deals[idx];
  const next = () => setIdx((i) => (i + 1) % deals.length);
  const prev = () => setIdx((i) => (i - 1 + deals.length) % deals.length);

  const bg = pal
    ? `radial-gradient(ellipse at 80% 20%, ${accent}26 0%, ${pal.surface} 55%)`
    : `radial-gradient(ellipse at top, ${accent}33 0%, #14141f 60%)`;

  return (
    <div className={`relative ${HERO_SIZE_PADDING[h.size] || "py-24"} px-4 overflow-hidden`} style={{ background: bg }}>
      {/* Centered top block */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        {sections.heroBadgeText && (
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-6"
            style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: pal?.text || "#ebebf5" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {sections.heroBadgeText}
          </span>
        )}
        <h1 className={`${h.titleClass} mb-5 text-balance`} style={{ fontFamily: style.headingFont }}>
          {title}
        </h1>
        <p className="text-sm sm:text-base max-w-xl mx-auto mb-8 opacity-75" style={{ fontFamily: style.bodyFont }}>
          {subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
            className={`px-6 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/10 ${h.ctaShape}`}
            style={{ fontFamily: style.headingFont, borderColor: "rgba(255,255,255,0.3)", color: pal?.text || "#ebebf5" }}
          >
            {sections.heroCtaText || "Explore now"}
          </button>
          {sections.heroSecondaryCtaText && (
            <button
              onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
              className={`px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${h.ctaShape}`}
              style={{ fontFamily: style.headingFont, background: accent, color: accentText }}
            >
              {sections.heroSecondaryCtaText}
            </button>
          )}
        </div>
      </motion.div>

      {/* Two-column band: character image left, Exclusive Deals card right */}
      <div className="relative z-10 max-w-6xl mx-auto mt-14 grid md:grid-cols-2 gap-10 items-center">
        {/* Left — character / feature image */}
        <div className="flex justify-center md:justify-start">
          {sideImage ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 110 }}
              src={sideImage}
              alt=""
              className="w-full max-w-md object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <div
              className="w-full max-w-md aspect-square rounded-3xl flex items-center justify-center"
              style={{ background: `radial-gradient(circle at center, ${accent}33, transparent 70%)` }}
            >
              <span className="text-sm opacity-50">Add a hero side image</span>
            </div>
          )}
        </div>

        {/* Right — Exclusive Deals product card slider */}
        {current && (
          <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {/* Section heading */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent }}>
                  <Flame className="w-4.5 h-4.5" style={{ color: accentText }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: style.headingFont }}>{DEALS_DEFAULTS.title}</h2>
                  <p className="text-[11px] opacity-60" style={{ fontFamily: style.bodyFont }}>{DEALS_DEFAULTS.subtitle}</p>
                </div>
              </div>
              {deals.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={prev} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-white/10 transition-colors" style={{ borderColor: pal?.cardBorder || "rgba(255,255,255,0.15)" }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={next} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-white/10 transition-colors" style={{ borderColor: pal?.cardBorder || "rgba(255,255,255,0.15)" }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* The real Exclusive Deals card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <SaaSCard
                  listing={current}
                  delay={0}
                  styleSpec={styleSpec}
                  onViewDetails={onViewDetails}
                  onBuySpot={onViewDetails}
                  onReserveSpot={onReserveSpot || onViewDetails}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  affiliateLink={affiliateLinkFor?.(current)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            {deals.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {deals.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === idx ? 18 : 6, background: i === idx ? accent : "rgba(255,255,255,0.25)" }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}