import React from "react";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, ExternalLink, Link2, Check, Clock } from "lucide-react";
import { toast } from "sonner";

const CUR = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

// Light "Appsfield" product card: image with badges + wishlist heart, category +
// rating row, title/description, price with strikethrough original + access pill,
// and a "View Deal" / "Add" button pair. Mirrors the reference marketplace card.
// All store business logic (cart, buy, reserve, affiliate, custom redirect) preserved.
export default function AppsfieldProductCard({
  listing,
  delay = 0,
  currency = "USD",
  onViewDetails,
  onReserveSpot,
  onAddToCart,
  onBuyNow,
  affiliateLink,
}) {
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [wished, setWished] = React.useState(false);
  const cur = CUR[currency] || "$";
  const {
    softwareName, category, shortDescription, logo, screenshots, price = 0,
    discountPrice = 0, sharePrice = 0, totalShares = 0, soldShares = 0, rating = 5,
    isBestSeller, isLifetimeDeal, status, dealType, customButton, noDayLimit, dealEndDate,
  } = listing || {};

  const accent = "#FF6B00";
  const thumbnail = logo || screenshots?.[0];
  const title = softwareName || "Untitled";
  const fullPrice = price && price > 0 ? price : (sharePrice || 0) * (totalShares || 0);
  const hasDiscount = discountPrice && discountPrice > 0 && discountPrice < fullPrice;
  const dealPrice = hasDiscount ? discountPrice : fullPrice;
  const discountPct = hasDiscount ? Math.round(((fullPrice - discountPrice) / fullPrice) * 100) : 0;
  const isSold = status === "sold";
  const sharesLeft = totalShares - soldShares;
  const hasCustomButton = customButton?.enabled && customButton?.url;
  const access = isLifetimeDeal ? "Lifetime" : dealType === "single_purchase" ? "Single" : "Group";

  const openCustomButton = (e) => {
    e.stopPropagation();
    if (customButton.openInNewTab === false) window.location.href = customButton.url;
    else window.open(customButton.url, "_blank", "noopener,noreferrer");
  };
  const grabLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(affiliateLink);
    setLinkCopied(true);
    toast.success("Affiliate link copied!");
    setTimeout(() => setLinkCopied(false), 1500);
  };

  // Primary "Add" action (right button).
  let addLabel = "Add";
  let onAdd = () => onAddToCart?.(listing);
  if (hasCustomButton) {
    addLabel = customButton.label || "Learn More";
    onAdd = openCustomButton;
  } else if (dealType !== "single_purchase") {
    addLabel = sharesLeft <= 0 ? "Sold Out" : "Reserve";
    onAdd = () => onReserveSpot?.(listing);
  } else if (onBuyNow) {
    addLabel = "Add";
    onAdd = () => onAddToCart?.(listing);
  }
  const addDisabled = isSold || (dealType !== "single_purchase" && !hasCustomButton && sharesLeft <= 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative flex flex-col h-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[#FF6B00] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)]"
      style={{ color: "#161616" }}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
        {isBestSeller && (
          <span className="bg-[#161616] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Best Seller</span>
        )}
        {isLifetimeDeal && !isBestSeller && (
          <span className="bg-[#179447] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Lifetime</span>
        )}
        {discountPct > 0 && !isBestSeller && !isLifetimeDeal && (
          <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{discountPct}% OFF</span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={(e) => { e.stopPropagation(); setWished((w) => !w); }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition"
      >
        <Heart className={`w-4 h-4 transition-colors ${wished ? "fill-[#FF6B00] text-[#FF6B00]" : "text-[#6B7280]"}`} />
      </button>

      {/* Image */}
      <div
        className="relative aspect-[16/10] overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onViewDetails?.(listing)}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
            <span className="text-[#FF6B00] font-bold text-lg text-center px-4">{title}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider truncate max-w-[60%]">{category || "Software"}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-medium text-[#161616]">{rating}</span>
          </div>
        </div>

        <h3 className="font-semibold text-[15px] leading-snug mb-1.5 line-clamp-2" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
        {shortDescription && <p className="text-[13px] text-[#6B7280] mb-4 line-clamp-2 flex-grow">{shortDescription}</p>}

        {noDayLimit ? (
          <div className="flex items-center gap-1 text-[11px] text-[#179447] font-medium mb-2">
            <Clock className="w-3 h-3" /> No time limit
          </div>
        ) : null}

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-3 border-t border-[#F7F7F7] pt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-xl text-[#161616]" style={{ fontFamily: "'Outfit', sans-serif" }}>{cur}{dealPrice.toLocaleString()}</span>
              {hasDiscount && <span className="text-xs text-[#6B7280] line-through">{cur}{fullPrice.toLocaleString()}</span>}
            </div>
            <span className="text-[10px] font-medium bg-[#F7F7F7] text-[#6B7280] px-2 py-1 rounded">{access}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onViewDetails?.(listing)}
              className="text-xs font-semibold py-2 border border-[#E5E7EB] rounded hover:bg-[#F7F7F7] transition text-[#161616] w-full"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              View Deal
            </button>
            <button
              onClick={onAdd}
              disabled={addDisabled}
              className="text-xs font-semibold py-2 bg-[#FF6B00] text-white rounded hover:bg-orange-600 transition shadow-sm w-full flex items-center justify-center gap-1 disabled:opacity-40"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {!hasCustomButton && dealType === "single_purchase" && <ShoppingCart className="w-3.5 h-3.5" />}
              {hasCustomButton && <ExternalLink className="w-3.5 h-3.5" />}
              {addLabel}
            </button>
          </div>

          {/* Buy Now for single-purchase (direct checkout) */}
          {!hasCustomButton && dealType === "single_purchase" && onBuyNow && (
            <button
              onClick={() => onBuyNow?.(listing)}
              disabled={isSold}
              className="w-full mt-2 py-2 rounded bg-[#161616] text-white text-xs font-semibold hover:bg-[#FF6B00] transition disabled:opacity-40"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Buy Now — {cur}{dealPrice.toLocaleString()}
            </button>
          )}

          {affiliateLink && (
            <button
              onClick={grabLink}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded border border-emerald-200 text-emerald-600 font-medium text-xs hover:bg-emerald-50 transition-colors"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {linkCopied ? "Link Copied" : "Grab Affiliate Link"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}