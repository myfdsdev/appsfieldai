import React from "react";
import { motion } from "framer-motion";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";
import StoreBinaseaHero from "./StoreBinaseaHero";
import StoreNexusHero from "./StoreNexusHero";

// Full branded hero for a customer's store page. Adapts its size, font,
// alignment, title treatment and shapes to the selected store style.
export default function StoreHero({ marketplace, sections = {}, listingsCount = 0, listings = [], currency = "USD", onViewDetails, onReserveSpot, onAddToCart, onBuyNow, affiliateLinkFor }) {
  // Binasea (monolith) uses a dedicated hero: centered text + character image
  // left + auto-rotating Exclusive Deals product slider on the right.
  if (sections.storeStyle === "monolith") {
    return (
      <StoreBinaseaHero
        marketplace={marketplace}
        sections={sections}
        listings={listings}
        currency={currency}
        onViewDetails={onViewDetails}
        onReserveSpot={onReserveSpot}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        affiliateLinkFor={affiliateLinkFor}
      />
    );
  }

  // Nexus uses a dedicated light-brand spotlight hero with trust row + dual CTAs.
  if (sections.storeStyle === "nexus") {
    return <StoreNexusHero marketplace={marketplace} sections={sections} listingsCount={listingsCount} />;
  }

  const style = getStoreStyle(sections.storeStyle);
  const h = style.hero;
  const pal = style.palette;
  // Theme palette color always wins over the custom brand color.
  const brandColor = pal?.accent || marketplace.branding?.primaryColor || "#f97316";
  const accentColor = pal?.accent || marketplace.branding?.accentColor || brandColor;
  const heroAccent = brandColor;

  // Reusable hero side image + its dynamic position (left / right / center).
  const sideImage = sections.heroSideImageUrl;
  const sidePos = sections.heroSideImagePosition || "right";
  // With a side image on the left/right, the hero becomes a 2-column split and
  // the text aligns left; "center" stacks the image above centered text.
  const hasSideSplit = sideImage && (sidePos === "left" || sidePos === "right");
  const isLeft = hasSideSplit ? true : h.align === "left";

  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Join group deals on premium software. Lock a slot, split the cost, and save big.";

  // ── Binabox-style full-bleed hero (Aurora) ──────────────────────────────
  // Full-width background image with a centered subject, big uppercase headline,
  // subheadline and a solid + outlined CTA pair.
  if (h.variant === "fullbleed") {
    const bgImage = sections.headerImageUrl;
    const fullBg = bgImage
      ? `linear-gradient(to bottom, rgba(6,10,8,0.35) 0%, rgba(6,10,8,0.55) 60%, ${pal?.surface || "#0b0d1a"} 100%), url(${bgImage}) center/cover no-repeat`
      : pal
      ? `radial-gradient(ellipse at 50% 30%, ${pal.accent}33 0%, ${pal.surface} 60%)`
      : `radial-gradient(ellipse at top, ${brandColor}33 0%, #0a0603 60%)`;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${HERO_SIZE_PADDING[h.size] || "py-36"} px-4 overflow-hidden text-center`}
        style={{ background: fullBg }}
      >
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {sections.heroBadgeText && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.13 }}
              className={`inline-flex items-center gap-2 px-3 py-1 border border-white/15 bg-white/5 text-white/80 text-xs mb-6 ${h.badgePill ? "rounded-full" : "rounded-none"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroAccent }} />
              {sections.heroBadgeText}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`${h.titleClass} mb-4 text-balance text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]`}
            style={{ fontFamily: style.headingFont }}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/75 text-sm sm:text-base max-w-xl mb-8"
            style={{ fontFamily: style.bodyFont }}
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
              className={`px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${h.ctaShape}`}
              style={{ fontFamily: style.headingFont, background: heroAccent, color: pal?.accentText || "#0a0f05" }}
            >
              {sections.heroCtaText || `${listingsCount} ${listingsCount === 1 ? "deal" : "deals"} live now`}
            </button>
            {sections.heroSecondaryCtaText && (
              <button
                onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
                className={`px-6 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/10 ${h.ctaShape} text-white`}
                style={{ fontFamily: style.headingFont, borderColor: "rgba(255,255,255,0.4)" }}
              >
                {sections.heroSecondaryCtaText}
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const bgType = sections.heroBgType || (sections.headerImageUrl ? "image" : "gradient");
  const opacity = (sections.heroBgOpacity ?? 100) / 100;
  let background;
  if (bgType === "image" && sections.headerImageUrl) {
    background = `linear-gradient(to bottom, rgba(10,6,3,0.7), rgba(10,6,3,0.95)), url(${sections.headerImageUrl}) center/cover`;
  } else if (bgType === "solid") {
    background = sections.heroSolidColor || "#0a0603";
  } else if (pal && !sections.heroGradientStart) {
    // Nitro-style palette: lime glow fading into the near-black surface.
    background = `radial-gradient(ellipse at 50% 0%, ${pal.accent}2e 0%, ${pal.surface} 55%)`;
  } else {
    const gStart = sections.heroGradientStart || `${brandColor}33`;
    const gEnd = sections.heroGradientEnd || "#0a0603";
    background = `radial-gradient(ellipse at top, ${gStart} 0%, ${gEnd} 60%)`;
  }

  const SideImage = ({ className = "" }) => (
    <motion.img
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.18, type: "spring", stiffness: 120 }}
      src={sideImage}
      alt=""
      className={`w-full max-w-md object-contain ${h.logoShape} ${className}`}
    />
  );

  const TextBlock = (
    <div className={`max-w-2xl ${isLeft ? "" : "mx-auto"}`}>
      {/* Badge */}
      {sections.heroBadgeText && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.13 }}
          className={`inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/5 text-foreground/70 text-xs mb-5 ${h.badgePill ? "rounded-full" : "rounded-none"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroAccent }} />
          {sections.heroBadgeText}
        </motion.span>
      )}

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`${h.titleClass} mb-5 text-balance`}
        style={{ fontFamily: style.headingFont }}
      >
        {h.gradientTitle ? (
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, ${accentColor})` }}
          >
            {title}
          </span>
        ) : (
          <span>{title}</span>
        )}
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`text-muted-foreground text-sm sm:text-base max-w-2xl mb-8 ${isLeft ? "" : "mx-auto"}`}
        style={{ fontFamily: style.bodyFont }}
      >
        {subtitle}
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <button
          onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
          className={`px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${h.ctaShape} ${pal ? "" : "bg-white text-black hover:bg-white/90"}`}
          style={{ fontFamily: style.headingFont, ...(pal ? { background: pal.accent, color: pal.accentText } : {}) }}
        >
          {sections.heroCtaText || `${listingsCount} ${listingsCount === 1 ? "deal" : "deals"} live now`}
        </button>
      </motion.div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${HERO_SIZE_PADDING[h.size] || "py-20"} px-4 overflow-hidden ${isLeft ? "text-left" : "text-center"}`}
      style={{ background, opacity }}
    >
      {hasSideSplit ? (
        // 2-column split: image left or right of the text.
        <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center ${sidePos === "left" ? "md:[direction:rtl]" : ""}`}>
          <div className="md:[direction:ltr]">{TextBlock}</div>
          <div className={`flex justify-center md:[direction:ltr] ${sidePos === "left" ? "md:justify-start" : "md:justify-end"}`}>
            <SideImage />
          </div>
        </div>
      ) : (
        <div className={`max-w-4xl ${isLeft ? "mx-auto md:mx-0 md:pl-8 lg:pl-16" : "mx-auto"}`}>
          {/* Center-positioned side image sits above the text */}
          {sideImage && sidePos === "center" && (
            <div className="flex justify-center mb-8"><SideImage className="max-w-sm" /></div>
          )}
          {TextBlock}
        </div>
      )}
    </motion.div>
  );
}