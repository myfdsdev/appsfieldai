import React from "react";
import { motion } from "framer-motion";
import { getStoreStyle } from "@/components/store/storeStyles";

// A themed banner band for the store page — an image background with a headline
// + subheadline. Matches the hero's visual style but at roughly half its height.
// Text position (left / center / right) is configurable by the store owner.
export default function StoreCustomBanner({ sections = {}, brandColor = "#f97316" }) {
  const title = sections.customBannerTitle;
  const subtitle = sections.customBannerSubtitle;
  const image = sections.customBannerImageUrl;

  // Nothing to show without at least a heading or image.
  if (!title && !subtitle && !image) return null;

  const style = getStoreStyle(sections.storeStyle);
  const pal = style.palette;
  const accent = pal?.accent || brandColor;
  const pos = sections.customBannerTextPosition || "center";

  const alignMap = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  // Background: image with a dark scrim, else the style's accent-tinted surface.
  const background = image
    ? `linear-gradient(to right, rgba(8,8,12,0.82), rgba(8,8,12,0.55)), url(${image}) center/cover`
    : pal
    ? `radial-gradient(ellipse at 50% 0%, ${accent}2e 0%, ${pal.surface} 60%)`
    : `radial-gradient(ellipse at top, ${accent}33 0%, #0a0603 60%)`;

  return (
    <section className="max-w-7xl mx-auto px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`relative overflow-hidden rounded-3xl px-6 sm:px-10 py-12 sm:py-14 flex flex-col justify-center ${alignMap[pos]}`}
        style={{ background, minHeight: "220px" }}
      >
        <div className="max-w-2xl">
          {title && (
            <h2
              className={`${style.hero.titleClass} text-2xl sm:text-3xl lg:text-4xl mb-3 text-balance`}
              style={{ fontFamily: style.headingFont, color: image ? "#fff" : undefined }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="text-sm sm:text-base text-white/80"
              style={{ fontFamily: style.bodyFont, color: image ? "rgba(255,255,255,0.82)" : undefined }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}