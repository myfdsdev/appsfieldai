import React from "react";
import { motion } from "framer-motion";

// A Siri-style circular voice wave that wraps around the agent's orb/avatar.
// Comes alive (expanding, brighter, faster ripples) while the agent is speaking,
// and rests as a calm gentle pulse otherwise.
export default function DealMakerVoiceWave({ speaking = false, brandColor = "#6366f1" }) {
  // Concentric rings that pulse outward from behind the avatar.
  const rings = [
    { color: brandColor, delay: 0 },
    { color: "#22d3ee", delay: 0.5 },
    { color: "#a855f7", delay: 1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {rings.map((r, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border"
          style={{
            width: "100%",
            height: "100%",
            borderColor: r.color,
            boxShadow: `0 0 ${speaking ? 20 : 8}px ${r.color}`,
          }}
          animate={{
            scale: speaking ? [1, 1.6] : [1, 1.25],
            opacity: speaking ? [0.6, 0] : [0.25, 0],
          }}
          transition={{
            duration: speaking ? 1.6 : 3.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: r.delay,
          }}
        />
      ))}
    </div>
  );
}