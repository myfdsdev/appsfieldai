import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// A large standing "character" portrait of the agent for the side / spotlight
// layouts. Sits inside a soft glow column with the name + tagline beneath.
export default function DealMakerCharacter({ name, tagline, image, brandColor = "#6366f1", spotlight = false }) {
  return (
    <div className="relative flex flex-col items-center justify-end h-full">
      {/* ambient glow behind the character */}
      <div
        className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full blur-[120px] opacity-50"
        style={{
          background: `radial-gradient(circle, ${brandColor}, transparent 70%)`,
          width: spotlight ? 640 : 420,
          height: spotlight ? 640 : 420,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className={`relative object-cover object-top rounded-3xl border border-white/15 shadow-2xl ${
              spotlight ? "w-[380px] h-[520px]" : "w-[300px] h-[420px]"
            }`}
            style={{ boxShadow: `0 30px 80px -20px ${brandColor}66` }}
          />
        ) : (
          <div
            className={`relative rounded-3xl border border-white/15 flex items-center justify-center bg-black/40 backdrop-blur-xl ${
              spotlight ? "w-[380px] h-[520px]" : "w-[300px] h-[420px]"
            }`}
          >
            <Sparkles className="w-20 h-20" style={{ color: brandColor }} />
          </div>
        )}
        <div className="mt-4 text-center">
          <h3 className="font-display font-bold text-white text-2xl">{name}</h3>
          <p className="text-xs uppercase tracking-[0.25em] mt-1" style={{ color: brandColor }}>{tagline}</p>
        </div>
      </motion.div>
    </div>
  );
}