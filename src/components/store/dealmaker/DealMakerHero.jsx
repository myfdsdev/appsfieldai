import React from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";

// The "welcome" content for the Deal Maker agent.
// Renders as the top of the shared box. When `compact` is true (chat has started),
// the avatar/title shrink and the greeting + CTA collapse away, so the hero becomes
// a slim header that scrolls up with the conversation.
export default function DealMakerHero({ marketplace, brandColor = "#6366f1", onStart, compact = false }) {
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
      </div>

      <motion.div
        layout
        className={`relative flex flex-col items-center text-center px-8 ${compact ? "pt-6 pb-4" : "pt-10 pb-8"}`}
      >
        {/* Avatar with animated futuristic ring — shrinks in compact mode */}
        <motion.div layout className={`relative ${compact ? "mb-3" : "mb-5"}`}>
          {!compact && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 2px ${brandColor}55` }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <motion.div
            layout
            className={`relative rounded-full p-[2px] ${compact ? "w-14 h-14" : "w-28 h-28"}`}
            style={{ background: `conic-gradient(from 0deg, ${brandColor}, #22d3ee, ${brandColor})` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              {image ? (
                <img src={image} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className={compact ? "w-6 h-6" : "w-12 h-12"} style={{ color: brandColor }} />
              )}
            </div>
          </motion.div>
          {/* Online dot */}
          <span className={`absolute rounded-full bg-emerald-500 border-white/20 ${compact ? "bottom-0 right-0 w-3 h-3 border-2" : "bottom-1.5 right-1.5 w-5 h-5 border-[3px]"}`} />
        </motion.div>

        {/* Identity */}
        <motion.div layout className="flex items-center gap-2 mb-1">
          <h3 className={`font-display font-bold text-white ${compact ? "text-lg" : "text-2xl"}`}>{name}</h3>
          <Sparkles className={compact ? "w-4 h-4" : "w-5 h-5"} style={{ color: brandColor }} />
        </motion.div>
        <motion.div
          layout
          className={`font-semibold uppercase tracking-[0.2em] rounded-full border ${compact ? "text-[10px] px-2.5 py-0.5" : "text-xs px-3 py-1 mb-5"}`}
          style={{ color: brandColor, borderColor: `${brandColor}55`, background: `${brandColor}12` }}
        >
          {tagline}
        </motion.div>

        {/* Greeting + CTA only show on the welcome (non-compact) state */}
        {!compact && (
          <>
            <p className="text-[15px] leading-relaxed text-white/75 max-w-md mb-7">{intro}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold shadow-lg"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
            >
              <MessageCircle className="w-5 h-5" /> Start the conversation
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}