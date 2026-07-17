import React from "react";
import { motion } from "framer-motion";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";

// Full branded hero for a customer's store page. Adapts its size, font,
// alignment, title treatment and shapes to the selected store style.
export default function StoreHero({ marketplace, sections = {}, listingsCount = 0 }) {
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