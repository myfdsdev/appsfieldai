import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Rocket } from "lucide-react";

// Steps shown one-by-one while the store is being built.
// These mirror the real work: create record → seed theme → AI content → products → publish.
const BUILD_STEPS = [
  "Creating your marketplace",
  "Applying branding & theme",
  "Writing your hero & headline",
  "Generating FAQs & testimonials",
  "Importing matching products",
  "Training your store agent",
  "Publishing your store",
];

export default function BuildingStoreOverlay({ storeName }) {
  const [active, setActive] = useState(0);

  // Walk through the steps on a timer so the user sees an engaging, real-feeling process.
  // The last step stays in "in progress" until the parent unmounts the overlay (build done).
  useEffect(() => {
    const timers = BUILD_STEPS.slice(0, -1).map((_, i) =>
      setTimeout(() => setActive(i + 1), (i + 1) * 1600)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-card/80 border border-border/40 rounded-2xl p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mb-3">
            <motion.div animate={{ rotate: [0, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Rocket className="w-7 h-7 text-white" />
            </motion.div>
          </div>
          <h3 className="text-lg font-display font-bold">Building The Store</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Setting up {storeName || "your marketplace"} — this only takes a moment.
          </p>
        </div>

        <div className="space-y-2.5">
          {BUILD_STEPS.map((label, i) => {
            const isDone = i < active;
            const isCurrent = i === active;
            return (
              <AnimatePresence key={label}>
                {(isDone || isCurrent) && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    </div>
                    <span className={`text-sm ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}