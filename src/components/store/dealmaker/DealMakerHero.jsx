import React from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, X } from "lucide-react";

// The "welcome" content for the Deal Maker agent.
// Renders as the inner content of the shared centered box (no backdrop / positioning here —
// the parent DealMakerWidget owns the box, backdrop and animation).
export default function DealMakerHero({ marketplace, brandColor = "#6366f1", onStart, onDismiss }) {
  const sections = marketplace?.pageSections || {};
  const name = sections.dealMakerName || "Max";
  const tagline = sections.dealMakerTagline || "AI Deal Strategist";
  const image = sections.dealMakerImageUrl;
  const storeName = marketplace?.name || "our store";
  const ownerName = sections.dealMakerOwnerName;

  const intro =
    sections.dealMakerGreeting ||
    `Welcome to ${storeName}. I'm ${name}${ownerName ? `, ${ownerName}'s deal maker` : ""} — I'll find you the perfect tool and the best price. Tell me about your business and let's get started.`;

  return (
    <div className="relative">
      {/* Frosted glass glow field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[100px] opacity-50"
          style={{ background: `radial-gradient(circle, ${brandColor}, transparent 70%)` }}
        />
        <div className="absolute -bottom-20 -right-16 w-[320px] h-[320px] rounded-full blur-[100px] opacity-30 bg-cyan-400" />
      </div>

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative px-8 pt-10 pb-8 flex flex-col items-center text-center">
        {/* Avatar with animated futuristic ring */}
        <div className="relative mb-5">
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${brandColor}55` }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <div
            className="relative w-28 h-28 rounded-full p-[2px]"
            style={{ background: `conic-gradient(from 0deg, ${brandColor}, #22d3ee, ${brandColor})` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              {image ? (
                <img src={image} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-12 h-12" style={{ color: brandColor }} />
              )}
            </div>
          </div>
          {/* Online dot */}
          <span className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white/20" />
        </div>

        {/* Identity */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-2xl font-display font-bold text-white">{name}</h3>
          <Sparkles className="w-5 h-5" style={{ color: brandColor }} />
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-5"
          style={{ color: brandColor, borderColor: `${brandColor}55`, background: `${brandColor}12` }}
        >
          {tagline}
        </div>

        {/* Professional intro */}
        <p className="text-[15px] leading-relaxed text-white/75 max-w-md mb-7">{intro}</p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
        >
          <MessageCircle className="w-5 h-5" /> Start the conversation
        </motion.button>
        <button onClick={onDismiss} className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}