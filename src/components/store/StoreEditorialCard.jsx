import React from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, ShoppingCart, Link2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CUR = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

// Horizontal "editorial" product row used by the Monolith store style — a wide
// media-object: large image on the left, generous copy + actions on the right.
export default function StoreEditorialCard({
  listing,
  delay = 0,
  styleSpec = {},
  currency = "USD",
  onViewDetails,
  onReserveSpot,
  onAddToCart,
  onBuyNow,
  affiliateLink,
}) {
  const [linkCopied, setLinkCopied] = React.useState(false);
  const cur = CUR[currency] || "$";
  const {
    softwareName, category, shortDescription, logo, screenshots, price = 0,
    sharePrice = 0, totalShares = 0, soldShares = 0, rating = 5, imageGradient,
    status, dealType,
  } = listing || {};
  const thumbnail = logo || screenshots?.[0];
  const title = softwareName || "Untitled";
  const fullPrice = price && price > 0 ? price : (sharePrice || 0) * (totalShares || 0);
  const isSold = status === "sold";
  const sharesLeft = totalShares - soldShares;
  const radius = styleSpec.radius || "rounded-none";
  const btn = styleSpec.buttonShape || "rounded-none";

  const grabLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(affiliateLink);
    setLinkCopied(true);
    toast.success("Affiliate link copied!");
    setTimeout(() => setLinkCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`group flex flex-col sm:flex-row border border-border/40 bg-card/60 overflow-hidden hover:border-orange-500/30 transition-all ${radius}`}
    >
      <div
        className={`sm:w-2/5 min-h-[180px] bg-gradient-to-br ${imageGradient} relative cursor-pointer shrink-0`}
        onClick={() => onViewDetails?.(listing)}
      >
        {thumbnail && <img src={thumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white text-[11px] font-medium">{rating}</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <Badge variant="outline" className="text-[10px] border-border/40 w-fit mb-2">{category}</Badge>
        <h3 className="font-display font-bold text-2xl leading-tight mb-2">{title}</h3>
        {shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{shortDescription}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Deal Price</p>
            <p className="text-2xl font-display font-bold text-[#f79a1b]">{cur}{fullPrice.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            {dealType !== "single_purchase" ? (
              <Button size="sm" onClick={() => onReserveSpot?.(listing)} disabled={isSold || sharesLeft <= 0}
                className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 ${btn}`}>
                {sharesLeft <= 0 ? "Sold Out" : "Reserve a Spot"}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => onAddToCart?.(listing)} disabled={isSold}
                  className={`border-orange-500/40 text-orange-400 hover:bg-orange-500/10 px-2.5 ${btn}`}>
                  <ShoppingCart className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => onBuyNow?.(listing)} disabled={isSold}
                  className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 ${btn}`}>
                  Buy Now
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => onViewDetails?.(listing)} className={`px-2 text-muted-foreground ${btn}`}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {affiliateLink && (
          <Button size="sm" variant="outline" onClick={grabLink}
            className={`w-full mt-3 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 ${btn}`}>
            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {linkCopied ? "Link Copied" : "Grab Affiliate Link"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}