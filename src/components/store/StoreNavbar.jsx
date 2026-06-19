import React from "react";
import { Store } from "lucide-react";

// Top navigation bar for a customer's public store page — mirrors the main app's
// top bar (logo + store name), styled with the store's own branding.
export default function StoreNavbar({ marketplace, sections = {} }) {
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const logo = sections.headerLogoUrl || marketplace.branding?.logo;
  const name = marketplace.name || "Store";

  const scrollToListings = () =>
    document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" });

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={name} className="w-9 h-9 object-contain rounded-lg" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColor }}>
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-lg font-display font-bold truncate max-w-[200px]">{name}</span>
        </div>
        <button
          onClick={scrollToListings}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: brandColor }}
        >
          Browse Deals
        </button>
      </div>
    </header>
  );
}