import React from "react";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";

// Full branded hero for a customer's store page. Adapts its size, font,
// alignment, title treatment and shapes to the selected store style.
export default function StoreHero({ marketplace, sections = {}, listingsCount = 0 }) {
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const accentColor = marketplace.branding?.accentColor || brandColor;
  const style = getStoreStyle(sections.storeStyle);
  const h = style.hero;
  const isLeft = h.align === "left";

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
  } else {
    const gStart = sections.heroGradientStart || `${brandColor}33`;
    const gEnd = sections.heroGradientEnd || "#0a0603";
    background = `radial-gradient(ellipse at top, ${gStart} 0%, ${gEnd} 60%)`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${HERO_SIZE_PADDING[h.size] || "py-20"} px-4 overflow-hidden ${isLeft ? "text-left" : "text-center"}`}
      style={{ background, opacity }}
    >
      <div className={`max-w-4xl ${isLeft ? "mx-auto md:mx-0 md:pl-8 lg:pl-16" : "mx-auto"}`}>
        {/* Badge / logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 200 }}
          className={`mb-5 ${isLeft ? "" : "mx-auto"}`}
        >
          {marketplace.branding?.logo ? (
            <img
              src={marketplace.branding.logo}
              alt={marketplace.name}
              className={`${h.logoSize} object-contain ${h.logoShape} ${isLeft ? "" : "mx-auto"}`}
            />
          ) : (
            <div
              className={`${h.logoSize} ${h.logoShape} flex items-center justify-center ${isLeft ? "" : "mx-auto"}`}
              style={{ background: brandColor }}
            >
              <Store className="w-1/2 h-1/2 text-white" />
            </div>
          )}
        </motion.div>

        {/* Badge */}
        {sections.heroBadgeText && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.13 }}
            className={`inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/5 text-foreground/70 text-xs mb-5 ${h.badgePill ? "rounded-full" : "rounded-none"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: brandColor }} />
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
            className={`px-6 py-2.5 bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors ${h.ctaShape}`}
            style={{ fontFamily: style.headingFont }}
          >
            {sections.heroCtaText || `${listingsCount} ${listingsCount === 1 ? "deal" : "deals"} live now`}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}