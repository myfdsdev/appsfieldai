import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, Link2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const CUR = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

// Clean, light "productized services" product card for the Nexus store style:
// white card, top image with a CATEGORY pill, a floating gradient icon badge,
// title + description, big bold price with "/project", and a full-width
// outlined action button. All business logic (cart, buy, reserve, affiliate,
// custom redirect) is preserved — this only changes the presentation.
export default function NexusProductCard({
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
  const cur = CUR[currency] || "$";
  const {
    softwareName, category, shortDescription, logo, screenshots, price = 0,
    sharePrice = 0, totalShares = 0, soldShares = 0, imageGradient,
    status, dealType, customButton,
  } = listing || {};

  const accent = "#7c3aed";
  const accent2 = "#d946ef";
  const thumbnail = logo || screenshots?.[0];
  const title = softwareName || "Untitled";
  const fullPrice = price && price > 0 ? price : (sharePrice || 0) * (totalShares || 0);
  const isSold = status === "sold";
  const sharesLeft = totalShares - soldShares;
  const hasCustomButton = customButton?.enabled && customButton?.url;

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

  // Primary action button — full-width, outlined, matching the reference.
  let actionLabel = "Add to Cart";
  let actionIcon = <ShoppingCart className="w-4 h-4" />;
  let onAction = () => onAddToCart?.(listing);
  if (hasCustomButton) {
    actionLabel = customButton.label || "Learn More";
    actionIcon = <ExternalLink className="w-4 h-4" />;
    onAction = openCustomButton;
  } else if (dealType !== "single_purchase") {
    actionLabel = sharesLeft <= 0 ? "Sold Out" : "Reserve a Spot";
    actionIcon = null;
    onAction = () => onReserveSpot?.(listing);
  }
  const actionDisabled = isSold || (dealType !== "single_purchase" && !hasCustomButton && sharesLeft <= 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      style={{ color: "#0f172a" }}
    >
      {/* Image */}
      <div
        className={`relative h-48 bg-gradient-to-br ${imageGradient || "from-violet-200 to-fuchsia-200"} cursor-pointer overflow-hidden`}
        onClick={() => onViewDetails?.(listing)}
      >
        {thumbnail && <img src={thumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
        {/* Category pill */}
        {category && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-slate-700 shadow-sm">
            {category}
          </span>
        )}
      </div>

      {/* Floating gradient icon badge, overlapping the image */}
      <div className="px-6">
        <div
          className="-mt-7 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-white"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-xl tracking-tight mb-2">{title}</h3>
        {shortDescription && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5">{shortDescription}</p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 mb-5">
            <span className="text-3xl font-extrabold tracking-tight">{cur}{fullPrice.toLocaleString()}</span>
            <span className="text-sm text-slate-400 font-medium">/project</span>
          </div>

          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-900 font-semibold text-sm transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-900"
          >
            {actionIcon}
            {actionLabel}
          </button>

          {/* Buy Now for single-purchase products (keeps the direct-checkout path) */}
          {!hasCustomButton && dealType === "single_purchase" && (
            <button
              onClick={() => onBuyNow?.(listing)}
              disabled={isSold}
              className="w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}
            >
              Buy Now — {cur}{fullPrice.toLocaleString()}
            </button>
          )}

          {affiliateLink && (
            <button
              onClick={grabLink}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 text-emerald-600 font-medium text-sm hover:bg-emerald-50 transition-colors"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {linkCopied ? "Link Copied" : "Grab Affiliate Link"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}