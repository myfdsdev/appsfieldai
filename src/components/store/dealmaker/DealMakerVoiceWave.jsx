import React from "react";
import { motion } from "framer-motion";

// A full-width Siri-style voice waveform that spans the whole page.
// Bars dance energetically while the agent speaks, and settle into a calm,
// low idle shimmer otherwise.
export default function DealMakerVoiceWave({ speaking = false, brandColor = "#6366f1" }) {
  const BARS = 48;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-[3px] sm:gap-[5px] px-4 h-40">
      {Array.from({ length: BARS }).map((_, i) => {
        // Center bars are tallest — creates a natural waveform envelope.
        const dist = Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
        const envelope = 1 - dist * 0.7;
        const peak = speaking ? (30 + Math.random() * 90) * envelope : 6 * envelope;
        const base = speaking ? (8 + Math.random() * 14) * envelope : 3 * envelope;
        const color = i % 3 === 0 ? brandColor : i % 3 === 1 ? "#22d3ee" : "#a855f7";
        return (
          <motion.span
            key={i}
            className="w-[3px] sm:w-[4px] rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            animate={{ height: speaking ? [base, peak, base] : [base, base * 1.6, base] }}
            transition={{
              duration: speaking ? 0.4 + Math.random() * 0.5 : 2 + Math.random(),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.02,
            }}
          />
        );
      })}
    </div>
  );
}