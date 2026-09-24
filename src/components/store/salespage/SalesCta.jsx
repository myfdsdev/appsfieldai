import React from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";

// Primary buy button for the product sales page. Honors the product's custom
// redirect button and blocks purchase when sales are paused or it's sold out.
export default function SalesCta({ listing, priceLabel, accent, accentText, onBuy, className = "" }) {
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-opacity hover:opacity-90 ${className}`;
  const style = { background: accent, color: accentText };
  const customBtn = listing.customButton?.enabled && listing.customButton.url ? listing.customButton : null;

  if (customBtn) {
    return (
      <a href={customBtn.url} target={customBtn.openInNewTab !== false ? "_blank" : "_self"} rel="noopener noreferrer" className={base} style={style}>
        <ExternalLink className="w-4 h-4" /> {customBtn.label?.trim() || "Learn More"}
      </a>
    );
  }

  const unavailable = listing.salesPaused || listing.status === "sold";
  if (unavailable) {
    return (
      <button disabled className={`${base} opacity-50 cursor-not-allowed`} style={style}>
        {listing.status === "sold" ? "Sold Out" : "Currently Unavailable"}
      </button>
    );
  }

  return (
    <button onClick={onBuy} className={base} style={style}>
      <ShoppingBag className="w-4 h-4" /> Get Instant Access — {priceLabel}
    </button>
  );
}