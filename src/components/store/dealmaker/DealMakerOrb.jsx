import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import DealMakerVoiceWave from "./DealMakerVoiceWave";

// The central breathing agent presence for the immersive full-page mode.
// A glowing orb that gently pulses; shrinks to a compact size once chatting.
export default function DealMakerOrb({ name, tagline, image, brandColor = "#6366f1", compact = false, speaking = false }) {
  const size = compact ? "w-16 h-16" : "w-28 h-28 sm:w-32 sm:h-32";
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div layout className="relative" style={{ willChange: "transform" }}>
        {/* soft breathing halo */}
        <motion.span
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: brandColor }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* rotating conic ring (border only — the photo stays upright) */}
        <motion.div
          layout
          className={`relative rounded-full ${size}`}
          style={{ padding: "2px" }}
        >
          {/* Siri-style circular voice wave — ripples out while the agent speaks */}
          <DealMakerVoiceWave speaking={speaking} brandColor={brandColor} />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(from 0deg, ${brandColor}, #22d3ee, ${brandColor})` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="relative w-full h-full rounded-full overflow-hidden bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className={compact ? "w-6 h-6" : "w-10 h-10"} style={{ color: brandColor }} />
            )}
          </motion.div>
        </motion.div>
        <span className={`absolute rounded-full bg-emerald-500 border-black/40 ${compact ? "bottom-0 right-0 w-3 h-3 border-2" : "bottom-1 right-1 w-5 h-5 border-[3px]"}`} />
      </motion.div>

      {!compact && (
        <motion.div layout className="mt-4">
          <h3 className="font-display font-bold text-white text-2xl">{name}</h3>
          <p className="text-xs uppercase tracking-[0.25em] mt-1" style={{ color: brandColor }}>{tagline}</p>
        </motion.div>
      )}
    </div>
  );
}