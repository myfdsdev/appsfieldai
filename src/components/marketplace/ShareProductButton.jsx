import React from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";

// Share link for a product: the store's mini sales page when viewed inside a store,
// otherwise the marketplace product page.
function productShareUrl(listing) {
  const origin = window.location.origin;
  const storeMatch = window.location.pathname.match(/^\/store\/([^/]+)/);
  if (storeMatch) return `${origin}/store/${storeMatch[1]}/p/${listing.id}`;
  if (getStoreKeyFromHost() || getCustomDomainFromHost()) return `${origin}/p/${listing.id}`;
  return `${origin}/saas/${listing.id}`;
}

export default function ShareProductButton({ listing, className = "" }) {
  const share = async () => {
    const url = productShareUrl(listing);
    if (navigator.share) {
      try { await navigator.share({ title: listing.softwareName, text: listing.shortDescription || "", url }); return; } catch { /* fall back to copy */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Product link copied!");
  };
  return (
    <button onClick={share} title="Share" className={className}>
      <Share2 className="w-4 h-4" />
    </button>
  );
}