import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";

// Slim header: store brand (links back to the store) + share button.
export default function SalesTopBar({ marketplace, storeHome, title }) {
  const logo = marketplace.branding?.logo;
  const share = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* fall back to copy */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };
  return (
    <header className="border-b border-border/40">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
        <Link to={storeHome} className="flex items-center gap-2 min-w-0 hover:opacity-80">
          <ArrowLeft className="w-4 h-4 shrink-0 opacity-60" />
          {logo ? <img src={logo} alt={marketplace.name} className="h-8 max-w-[160px] object-contain" /> : <span className="font-display font-bold truncate">{marketplace.name}</span>}
        </Link>
        <button onClick={share} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border/40 hover:opacity-80">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </header>
  );
}