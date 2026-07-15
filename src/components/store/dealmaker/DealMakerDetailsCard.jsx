import React from "react";
import { motion } from "framer-motion";
import { Star, Check, Sparkles, ShieldCheck, LifeBuoy, ShoppingCart, LayoutGrid, MessageCircleQuestion } from "lucide-react";

// A rich, full "deep dive" card the Deal Maker shows when the visitor asks to
// know more about a product. Unlike the compact product card, this leads with
// the product's real screenshots/gallery, then lays out structured features,
// use cases and pricing — everything the agent needs to make up the buyer's mind.
export default function DealMakerDetailsCard({ listing, brandColor = "#f97316", currency = "USD", onAction }) {
  if (!listing) return null;

  const fmt = (n) =>
    n == null ? null : new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const full = fmt(listing.price);
  const share = fmt(listing.sharePrice);
  const discount = fmt(listing.discountPrice);

  const screenshots = (listing.screenshots || []).filter(Boolean);
  const features = (listing.features || []).filter(Boolean);
  const useCases = (listing.tags || []).filter(Boolean);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl text-left"
      style={{
        background: "rgba(12,14,20,0.78)",
        borderColor: "rgba(255,255,255,0.14)",
        backdropFilter: "blur(14px)",
        boxShadow: `0 20px 60px -20px ${brandColor}55`,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Gallery — leads with the product's real screenshots */}
      {screenshots.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide p-3 bg-black/40">
          {screenshots.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${listing.softwareName} screenshot ${i + 1}`}
              className="h-44 rounded-xl object-cover shrink-0 border border-white/10"
            />
          ))}
        </div>
      ) : (
        <div
          className="h-28 flex items-center justify-center"
          style={{ background: listing.imageGradient || `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
        >
          {listing.logo ? (
            <img src={listing.logo} alt={listing.softwareName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg" />
          ) : (
            <span className="text-2xl font-bold text-white">{listing.softwareName?.[0] || "?"}</span>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Title + rating + category */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xl font-bold text-white leading-tight">{listing.softwareName}</h4>
            {listing.category && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                {listing.category}
              </span>
            )}
          </div>
          {listing.rating != null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-white/70">{listing.rating} rating</span>
            </div>
          )}
          {(listing.shortDescription || listing.fullDescription) && (
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              {listing.shortDescription || listing.fullDescription}
            </p>
          )}
        </div>

        {/* Structured features */}
        {features.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: brandColor }} /> What you get
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {features.slice(0, 8).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: brandColor }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Use cases */}
        {useCases.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">Perfect for</p>
            <div className="flex flex-wrap gap-2">
              {useCases.slice(0, 8).map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Support & guarantee chips */}
        {(listing.supportInfo || listing.refundPolicy || listing.usageLimits) && (
          <div className="flex flex-col gap-1.5 text-xs text-white/60">
            {listing.usageLimits && (
              <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />{listing.usageLimits}</p>
            )}
            {listing.supportInfo && (
              <p className="flex items-start gap-1.5"><LifeBuoy className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />{listing.supportInfo}</p>
            )}
            {listing.refundPolicy && (
              <p className="flex items-start gap-1.5"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />{listing.refundPolicy}</p>
            )}
          </div>
        )}

        {/* Pricing — the two ways to buy */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {full && (
            <div className="rounded-xl border border-white/12 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-white/50">Buy in full</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {discount && listing.discountPrice < listing.price ? discount : full}
              </p>
              {discount && listing.discountPrice < listing.price && (
                <p className="text-xs text-white/40 line-through">{full}</p>
              )}
            </div>
          )}
          {share && (
            <div className="rounded-xl border p-3" style={{ borderColor: `${brandColor}66`, background: `${brandColor}18` }}>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Single spot / share</p>
              <p className="text-lg font-bold text-white mt-0.5">{share}</p>
              {listing.totalShares != null && listing.soldShares != null && (
                <p className="text-xs text-white/50">{Math.max(0, listing.totalShares - listing.soldShares)} spots left</p>
              )}
            </div>
          )}
        </div>

        {/* Quick-action tabs — drive the visitor to buy, browse more, or ask */}
        {onAction && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onAction(`I want to buy ${listing.softwareName}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
            >
              <ShoppingCart className="w-4 h-4" /> Buy this now
            </button>
            <button
              onClick={() => onAction("Show me more products")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/90 border border-white/20 bg-white/5 transition-colors hover:bg-white/10"
            >
              <LayoutGrid className="w-4 h-4" /> Show me more products
            </button>
            <button
              onClick={() => onAction("I have a question about this")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/90 border border-white/20 bg-white/5 transition-colors hover:bg-white/10"
            >
              <MessageCircleQuestion className="w-4 h-4" /> Something else
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}