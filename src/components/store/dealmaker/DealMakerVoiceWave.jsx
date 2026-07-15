import React from "react";
import { motion } from "framer-motion";

// A Siri-style animated voice wave pinned to the bottom of the immersive chat.
// Comes alive (taller, brighter, faster) while the agent is speaking, and rests
// as a calm gentle ripple otherwise.
export default function DealMakerVoiceWave({ speaking = false, brandColor = "#6366f1" }) {
  // Three overlapping wave layers at different speeds/opacities for depth.
  const layers = [
    { color: brandColor, opacity: speaking ? 0.55 : 0.18, dur: speaking ? 2.2 : 6, amp: speaking ? 1 : 0.4 },
    { color: "#22d3ee", opacity: speaking ? 0.45 : 0.14, dur: speaking ? 3 : 7, amp: speaking ? 0.85 : 0.35 },
    { color: "#a855f7", opacity: speaking ? 0.4 : 0.12, dur: speaking ? 2.6 : 8, amp: speaking ? 0.7 : 0.3 },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 h-40 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ scaleY: speaking ? [1, 1.35, 0.9, 1.2, 1] : [1, 1.08, 1] }}
        transition={{ duration: speaking ? 1.4 : 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "bottom" }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          {layers.map((l, i) => (
            <motion.path
              key={i}
              fill="none"
              stroke={l.color}
              strokeWidth={speaking ? 3 : 2}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 ${speaking ? 10 : 4}px ${l.color})`, opacity: l.opacity }}
              animate={{
                d: [
                  `M0,140 C200,${140 - 50 * l.amp} 400,${140 + 40 * l.amp} 600,140 C800,${140 - 55 * l.amp} 1000,${140 + 35 * l.amp} 1200,140`,
                  `M0,140 C200,${140 + 45 * l.amp} 400,${140 - 50 * l.amp} 600,140 C800,${140 + 40 * l.amp} 1000,${140 - 55 * l.amp} 1200,140`,
                  `M0,140 C200,${140 - 50 * l.amp} 400,${140 + 40 * l.amp} 600,140 C800,${140 - 55 * l.amp} 1000,${140 + 35 * l.amp} 1200,140`,
                ],
              }}
              transition={{ duration: l.dur, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}