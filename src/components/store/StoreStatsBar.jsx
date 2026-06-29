import React from "react";
import { motion } from "framer-motion";

// Stats bar shown on a store page — up to 3 metric cards (value + label).
// Driven by the store's pageSections.statsCards config.
export default function StoreStatsBar({ title, cards = [], brandColor = "#f97316" }) {
  const visible = (cards || []).filter(c => c && (c.value || c.label));
  if (visible.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      {title && (
        <h2 className="text-center text-xl md:text-2xl font-display font-bold mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visible.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border/40 bg-card/60 p-6 text-center"
          >
            <p className="text-3xl md:text-4xl font-display font-extrabold" style={{ color: brandColor }}>{c.value || "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}