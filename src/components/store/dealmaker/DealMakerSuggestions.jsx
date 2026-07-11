import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Floating tappable quick-reply chips shown under the latest agent message.
// Boundary-less glass pills that gently rise in and dissolve when one is picked.
export default function DealMakerSuggestions({ suggestions = [], brandColor = "#6366f1", onPick, disabled }) {
  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          key="dm-suggestions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex flex-wrap justify-center gap-2.5 pt-1"
        >
          {suggestions.map((s, i) => (
            <motion.button
              key={s + i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 22 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              disabled={disabled}
              onClick={() => onPick?.(s)}
              className="group relative rounded-full px-4 py-2 text-sm font-medium text-white/90 border border-white/15 bg-white/[0.06] backdrop-blur-md transition-colors hover:text-white disabled:opacity-40"
              style={{ boxShadow: `0 0 0 1px ${brandColor}22` }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 18px 1px ${brandColor}55`, background: `${brandColor}14` }}
              />
              <span className="relative">{s}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}