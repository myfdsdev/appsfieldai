import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star, Zap } from "lucide-react";
import { getStoreStyle, HERO_SIZE_PADDING } from "./storeStyles";

// Dedicated hero for the "Nexus" store style — a clean, dark spotlight hero
// with a live status badge, gradient headline, dual CTAs and a trust row
// (avatar stack + 5-star rating). Matches the productized-services reference.
export default function StoreNexusHero({ marketplace, sections = {}, listingsCount = 0 }) {
  const style = getStoreStyle("nexus");
  const pal = style.palette;
  const accent = pal.accent;
  const accent2 = "#d946ef"; // fuchsia companion for gradients

  const title = sections.headerTitle || marketplace.name;
  const subtitle =
    sections.headerSubtitle ||
    "No endless sales calls. No scope creep. Just transparent pricing and world-class execution. Browse, add to cart, and let's grow.";

  const bgImage = sections.headerImageUrl;
  const bg = bgImage
    ? `linear-gradient(to bottom, rgba(2,6,23,0.85), rgba(2,6,23,0.95)), url(${bgImage}) center/cover no-repeat`
    : "#020617";

  const avatars = [11, 12, 13, 14, 15].map((n) => `https://i.pravatar.cc/100?img=${n}`);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${HERO_SIZE_PADDING[style.hero.size] || "py-36"} px-4 overflow-hidden text-center`}
      style={{ background: bg, fontFamily: style.bodyFont }}
    >
      {/* Ambient blurred color blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[110px]" style={{ background: `${accent}4d` }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: `${accent2}33` }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {/* Status badge */}
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-gray-300 text-sm font-medium">
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping" />
          {sections.heroBadgeText || "Accepting new projects"}
        </span>

        {/* Headline — last two words get the gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${style.hero.titleClass} mb-6 text-white max-w-4xl`}
          style={{ fontFamily: style.headingFont }}
        >
          <GradientTitle title={title} accent={accent} accent2={accent2} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Dual CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 bg-white text-slate-900 rounded-full font-extrabold text-base transition-all hover:scale-105 hover:shadow-2xl hover:shadow-white/20 flex items-center justify-center group"
          >
            {sections.heroCtaText || "Explore Services"}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          {sections.heroSecondaryCtaText && (
            <button
              onClick={() => document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 bg-transparent text-white border border-white/20 rounded-full font-bold text-base transition-all hover:bg-white/10"
            >
              {sections.heroSecondaryCtaText}
            </button>
          )}
        </motion.div>

        {/* Trust row */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex -space-x-3">
            {avatars.map((src, i) => (
              <img key={i} src={src} alt="" className="w-10 h-10 rounded-full border-2 object-cover" style={{ borderColor: "#020617" }} />
            ))}
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="flex mb-1" style={{ color: "#facc15" }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p>Trusted by <span className="font-bold text-white">500+</span> growing brands.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Renders the title with the final ~2 words wrapped in a violet→fuchsia gradient.
function GradientTitle({ title, accent, accent2 }) {
  const words = (title || "").trim().split(/\s+/);
  if (words.length <= 2) {
    return (
      <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${accent}, ${accent2})` }}>
        {title}
      </span>
    );
  }
  const head = words.slice(0, words.length - 2).join(" ");
  const tail = words.slice(words.length - 2).join(" ");
  return (
    <>
      {head}{" "}
      <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${accent}, ${accent2})` }}>
        {tail}
      </span>
    </>
  );
}