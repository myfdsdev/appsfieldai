import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Info, Star, ArrowRight, X } from "lucide-react";

// An inline product card the Deal Maker drops into the conversation.
// - mode "card":  compact preview (image, name, short desc, price) + "Tell me more".
// - mode "demo":  shows the product's ACTUAL demo — its video if it has one,
//                 otherwise its screenshots gallery — pulled from the listing data.
// Everything renders in-chat; nothing leaves the immersive experience.
export default function DealMakerProductCard({ listing, mode = "card", brandColor = "#f97316", currency = "USD", onMoreDetails, onReserve }) {
  const [showDemo, setShowDemo] = useState(mode === "demo");
  if (!listing) return null;

  const fmt = (n) =>
    n == null ? null : new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const price = fmt(listing.discountPrice ?? listing.price ?? listing.sharePrice);
  const original = listing.discountPrice && listing.price && listing.price > listing.discountPrice ? fmt(listing.price) : null;
  const screenshots = (listing.screenshots || []).filter(Boolean);
  const hasDemo = !!listing.demoVideoUrl || screenshots.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-md rounded-2xl overflow-hidden border shadow-2xl"
      style={{
        background: "rgba(12,14,20,0.72)",
        borderColor: "rgba(255,255,255,0.14)",
        backdropFilter: "blur(14px)",
        boxShadow: `0 20px 60px -20px ${brandColor}55`,
      }}
    >
      {/* Header image / logo band */}
      <div
        className="relative h-28 flex items-center justify-center"
        style={{ background: listing.imageGradient || `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
      >
        {listing.logo ? (
          <img src={listing.logo} alt={listing.softwareName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg" />
        ) : (
          <span className="text-2xl font-bold text-white">{listing.softwareName?.[0] || "?"}</span>
        )}
        {listing.category && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-black/30 text-white/90">
            {listing.category}
          </span>
        )}
      </div>

      <div className="p-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-white leading-tight">{listing.softwareName}</h4>
            {listing.rating != null && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-white/70">{listing.rating}</span>
              </div>
            )}
          </div>
          {price && (
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-white">{price}</p>
              {original && <p className="text-xs text-white/40 line-through">{original}</p>}
            </div>
          )}
        </div>

        {listing.shortDescription && (
          <p className="text-sm text-white/70 mt-2 leading-relaxed line-clamp-3">{listing.shortDescription}</p>
        )}

        {/* Inline DEMO preview — real product data */}
        {showDemo && hasDemo && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            {listing.demoVideoUrl ? (
              <VideoEmbed url={listing.demoVideoUrl} />
            ) : (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2">
                {screenshots.map((src, i) => (
                  <img key={i} src={src} alt={`${listing.softwareName} screenshot ${i + 1}`} className="h-40 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}
          </div>
        )}
        {showDemo && !hasDemo && (
          <p className="mt-4 text-xs text-white/50 italic">No demo media available for this product yet.</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {mode !== "demo" && hasDemo && !showDemo && (
            <button
              onClick={() => setShowDemo(true)}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium text-white border border-white/15 hover:bg-white/5 transition-colors"
            >
              <Play className="w-4 h-4" /> Watch demo
            </button>
          )}
          {showDemo && mode !== "demo" && (
            <button
              onClick={() => setShowDemo(false)}
              className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm text-white/70 border border-white/15 hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" /> Hide
            </button>
          )}
          <button
            onClick={() => onMoreDetails?.(listing)}
            className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
          >
            <Info className="w-4 h-4" /> Tell me more
          </button>
        </div>

        {onReserve && (
          <button
            onClick={() => onReserve(listing)}
            className="w-full mt-2 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/5 transition-colors"
          >
            Reserve my spot <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Renders a YouTube / Vimeo embed or a raw video file inline.
function VideoEmbed({ url }) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${yt[1]}`}
          title="Product demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (vimeo) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://player.vimeo.com/video/${vimeo[1]}`}
          title="Product demo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <video src={url} controls className="w-full max-h-64" />;
}