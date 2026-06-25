import React from "react";
import { LayoutGrid } from "lucide-react";

// Category chip strip for a store page — combines the store's saved categories
// (created at setup or in the Categories manager) with any used by listings.
export default function StoreCategories({ listings = [], savedCategories = [], brandColor = "#f97316", onSelect }) {
  const savedNames = savedCategories.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean);
  const listingNames = listings.map((l) => l.category).filter(Boolean);
  const categories = Array.from(new Set([...savedNames, ...listingNames]));

  if (categories.length === 0) return null;

  return (
    <section id="store-categories" className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: brandColor }}>
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">Categories</h2>
          <p className="text-xs text-muted-foreground">Browse deals by category</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect?.(cat)}
            className="px-4 py-2 rounded-full text-sm border border-border/40 bg-secondary/40 hover:bg-secondary/70 hover:border-border transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
}