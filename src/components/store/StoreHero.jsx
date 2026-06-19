import React from "react";
import { motion } from "framer-motion";
import { Store } from "lucide-react";

// Full branded hero for a customer's store page — mirrors the main marketplace hero
// but uses the store's own branding colors and section text.
export default function StoreHero({ marketplace, sections = {}, listingsCount = 0 }) {
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const accentColor = marketplace.branding?.accentColor || brandColor;

  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "Join group deals on premium software. Lock a slot, split the cost, and save big.";

  const background = sections.headerImageUrl
    ? `linear-gradient(to bottom, rgba(10,6,3,0.7), rgba(10,6,3,0.95)), url(${sections.headerImageUrl}) center/cover`
    : `radial-gradient(ellipse at top, ${brandColor}33 0%, transparent 55%), #0a0603`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-20 px-4 text-center overflow-hidden"
      style={{ background }}
    >
      {/* Badge / logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 200 }}
        className="mx-auto mb-5"
      >
        {marketplace.branding?.logo ? (
          <img
            src={marketplace.branding.logo}
            alt={marketplace.name}
            className="w-20 h-20 object-contain mx-auto rounded-2xl"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: brandColor }}
          >
            <Store className="w-10 h-10 text-white" />
          </div>
        )}
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-5"
      >
        <span
          className="text-transparent bg-clip-text"
          style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, ${accentColor})` }}
        >
          {title}
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8"
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
          className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          {listingsCount} {listingsCount === 1 ? "deal" : "deals"} live now
        </button>
      </motion.div>
    </motion.div>
  );
}