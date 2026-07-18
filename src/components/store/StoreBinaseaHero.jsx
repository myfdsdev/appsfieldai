import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Clock, User } from "lucide-react";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";

// Live countdown to a deal/auction end — mirrors the "12 : 30 : 15" chip.
function useCountdown(endDate) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return "00 : 00 : 00";
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}

// ── Binasea-style hero ────────────────────────────────────────────────────
// Centered headline + subheadline + two CTAs on top, then a two-column band:
// a large character image on the LEFT and an auto-rotating "Exclusive Deals"
// product card on the RIGHT (one product at a time, with prev/next controls).
export default function StoreBinaseaHero({ marketplace, sections = {}, listings = [], currency = "USD", onViewDetails, onReserveSpot }) {
  const style = getStoreStyle(sections.storeStyle);
  const h = style.hero;
  const pal = style.palette;
  const accent = pal?.accent || marketplace.branding?.primaryColor || "#5142fc";
  const accentText = pal?.accentText || "#ffffff";

  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Join group deals on premium software. Lock a slot, split the cost, and save big.";
  const sideImage = sections.heroSideImageUrl;

  // Products to feature in the slider — up to 8 live listings.
  const featured = listings.slice(0, 8);
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [featured.length]);
  React.useEffect(() => {
    if (paused || featured.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 4500);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  const current = featured[idx];
  const countdown = useCountdown(current?.dealEndDate || current?.auctionEndsAt);
  const next = () => setIdx((i) => (i + 1) % featured.length);
  const prev = () => setIdx((i) => (i - 1 + featured.length) % featured.length);

  const priceOf = (l) => l?.sharePrice || l?.discountPrice || l?.price || 0;
  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n || 0);

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

      {/* Two-column band: character image left, product slider right */}
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

        {/* Right — Exclusive Deals product slider card */}
        {current && (
          <div
            className="relative rounded-2xl border p-5 sm:p-6 backdrop-blur-sm"
            style={{ background: pal ? `${pal.card}cc` : "rgba(31,31,43,0.8)", borderColor: pal?.cardBorder || "rgba(255,255,255,0.08)" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Header row: title + slider controls */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: accent }}>
                  <Zap className="w-3.5 h-3.5" /> Exclusive Deals
                </div>
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={current.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-lg sm:text-xl font-bold truncate"
                    style={{ fontFamily: style.headingFont }}
                  >
                    {current.softwareName}
                  </motion.h3>
                </AnimatePresence>
                <p className="text-xs opacity-60 truncate">{current.category || current.shortDescription || "Limited edition"}</p>
              </div>
              {featured.length > 1 && (
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

            {/* Product visual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "_img"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl overflow-hidden mb-4 h-40 flex items-center justify-center"
                style={{ background: current.imageGradient || `linear-gradient(135deg, ${accent}44, ${pal?.surface || "#14141f"})` }}
              >
                {(current.screenshots?.[0] || current.logo) ? (
                  <img src={current.screenshots?.[0] || current.logo} alt={current.softwareName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold opacity-70" style={{ fontFamily: style.headingFont }}>{current.softwareName?.[0] || "•"}</span>
                )}
              </motion.div>

              {/* Creator */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${accent}22` }}>
                  <User className="w-4 h-4" style={{ color: accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] opacity-55">Creator</p>
                  <p className="text-sm font-medium truncate" style={{ color: accent }}>{current.sellerName || marketplace.name}</p>
                </div>
              </div>

              {/* Bid + countdown */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] opacity-55 mb-0.5">Current price</p>
                  <p className="text-lg font-bold" style={{ fontFamily: style.headingFont }}>{fmtPrice(priceOf(current))}</p>
                </div>
                {countdown && (
                  <div className="text-right">
                    <p className="text-[11px] opacity-55 mb-0.5 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Ends in</p>
                    <p className="text-lg font-bold tabular-nums" style={{ fontFamily: style.headingFont }}>{countdown}</p>
                  </div>
                )}
              </div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onReserveSpot?.(current)}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ fontFamily: style.headingFont, background: accent, color: accentText }}
              >
                Reserve spot
              </button>
              <button
                onClick={() => onViewDetails?.(current)}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold border transition-colors hover:bg-white/10"
                style={{ fontFamily: style.headingFont, borderColor: pal?.cardBorder || "rgba(255,255,255,0.2)" }}
              >
                View details
              </button>
            </div>

            {/* Dots */}
            {featured.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {featured.map((_, i) => (
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