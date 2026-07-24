import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Clock, Gavel, Shield, Bot, Zap, BadgeCheck, ExternalLink, Heart, Video, ShoppingCart, Link2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

function CountdownTimer({ endDate }) {
  const target = new Date(endDate).getTime();
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const urgent = days === 0 && hours < 6;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${urgent ? "text-red-400" : "text-amber-400"}`}>
      <Clock className="w-3 h-3" />
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </div>
  );
}

function RiskBadge({ score }) {
  const config = score <= 3 
    ? { label: "Low Risk", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
    : score <= 6 
    ? { label: "Medium Risk", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    : { label: "High Risk", color: "bg-red-500/10 text-red-400 border-red-500/20" };

  return (
    <Badge className={`text-[10px] border ${config.color} flex items-center gap-1`}>
      <Shield className="w-3 h-3" /> {config.label} ({score}/10)
    </Badge>
  );
}

function AIScoreBadge({ score }) {
  return (
    <Badge className="text-[10px] border bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
      <Bot className="w-3 h-3" /> AI Score {score}%
    </Badge>
  );
}

export default function SaaSCard({ listing, marketplaceName, delay = 0, onReserveSpot, onRequestAcquisition, onRequestDemo, onViewDetails, onFavoriteToggle, isFavorited, onBuySpot, onAddToCart, onBuyNow, affiliateLink, styleSpec }) {
  const navigate = useNavigate();
  // Store style overrides (card radius, image height, button shape). Defaults
  // preserve the original marketplace look when no styleSpec is passed.
  const cardRadius = styleSpec?.radius || "rounded-2xl";
  const imgHeight = styleSpec?.imageHeight && styleSpec.imageHeight !== "h-full" ? styleSpec.imageHeight : "h-36";
  const btnShape = styleSpec?.buttonShape || "rounded-lg";
  // Full style personality: border, background, hover and title treatment + fonts.
  const cardBorder = styleSpec?.cardBorder || "border border-border/40";
  const cardBg = styleSpec?.cardBg || "bg-card/60 backdrop-blur-xl";
  const cardHover = styleSpec?.cardHover || "hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5";
  const titleClass = styleSpec?.titleClass || "font-display font-bold text-base";
  const headingFont = styleSpec?.headingFont;
  const bodyFont = styleSpec?.bodyFont;
  // A style palette accent (e.g. Nitro's lime) recolors the primary CTAs.
  const accent = styleSpec?.accent;
  const accentText = styleSpec?.accentText || "#0a0f05";
  const palText = styleSpec?.text;
  // When a store style provides its own palette, drive the pricing boxes,
  // category pill and muted text off it so they don't fall back to washed
  // theme-token grays.
  const boxStyle = accent ? { background: `${accent}12` } : undefined;
  const mutedStyle = palText ? { color: palText, opacity: 0.6 } : undefined;
  const priceColor = accent || "#f79a1b";
  // When an accent is set, drop the orange gradient and use a solid accent fill.
  const primaryBtnClass = accent
    ? `flex-1 ${btnShape} text-[11px] h-8 disabled:opacity-40 border-0 font-semibold`
    : `flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 ${btnShape} text-[11px] h-8 disabled:opacity-40 text-white border-0`;
  const primaryBtnStyle = accent ? { background: accent, color: accentText } : undefined;
  const [favLoading, setFavLoading] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  const handleGrabLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(affiliateLink);
    setLinkCopied(true);
    toast.success("Affiliate link copied!");
    setTimeout(() => setLinkCopied(false), 1500);
  };
  const { softwareName, category, sellerName, resolvedSellerName, logo, screenshots, price = 0, sharePrice = 0, totalShares = 0, soldShares = 0, monthlyRevenue = 0, growthRate = 0, rating = 5, imageGradient, status, auctionEndsAt, riskScore = 5, aiScore = 75, dealEndDate, noDayLimit, dealType, customButton } = listing || {};
  // When the owner sets a custom redirect button, it replaces the default Buy button.
  const hasCustomButton = customButton?.enabled && customButton?.url;
  const openCustomButton = () => {
    if (customButton.openInNewTab === false) window.location.href = customButton.url;
    else window.open(customButton.url, "_blank", "noopener,noreferrer");
  };
  const thumbnail = logo || screenshots?.[0];
  const displaySeller = resolvedSellerName || sellerName;
  const title = softwareName || "Untitled";
  // Full/deal price prefers the actual `price` field the owner edits; falls back to
  // spots × per-spot price for older group deals that never set `price`.
  const fullPrice = (price && price > 0) ? price : (sharePrice || 0) * (totalShares || 0);
  const isSold = status === "sold";
  const sharesLeft = totalShares - soldShares;
  const sharePercent = totalShares > 0 ? (soldShares / totalShares) * 100 : 0;

  const handleFavToggle = async (e) => {
    e.stopPropagation();
    setFavLoading(true);
    if (onFavoriteToggle) await onFavoriteToggle(listing);
    setFavLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ fontFamily: bodyFont }}
      className={`group ${cardRadius} ${cardBorder} ${cardBg} ${cardHover} overflow-hidden transition-all duration-300 flex flex-col`}
    >
      {/* Image / Header */}
      <div
        className={`${imgHeight} bg-gradient-to-br ${imageGradient} relative flex items-center justify-center overflow-hidden cursor-pointer`}
        onClick={() => onViewDetails ? onViewDetails(listing) : navigate(`/saas/${listing.id}`)}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        {!thumbnail && (
          <span className="relative text-white font-display font-bold text-xl text-center px-4 leading-tight drop-shadow-lg">{title}</span>
        )}

        {/* Hover overlay with "View Details" */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250">
          <div className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-5 py-2 rounded-full shadow-lg">
            <ExternalLink className="w-4 h-4" />
            View Details
          </div>
        </div>

        {status === "auction" && (
          <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] border-0 flex items-center gap-1">
            <Gavel className="w-3 h-3" /> Auction
          </Badge>
        )}
        {isSold && (
          <Badge className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] border-0 flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" /> Sold
          </Badge>
        )}
        {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white font-display font-bold text-2xl tracking-widest border-2 border-white/30 rounded-lg px-4 py-1 bg-black/30 backdrop-blur-sm rotate-[-8deg]">SOLD</span>
        </div>}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white text-[11px] font-medium">{rating}</span>
        </div>
        <button
          onClick={handleFavToggle}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFavorited ? "bg-pink-500/30 text-pink-400" : "bg-black/40 text-white/60 hover:bg-black/60 hover:text-pink-300"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-pink-400" : ""}`} />
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Title */}
        <h3 className={`${titleClass} leading-snug line-clamp-1`} style={{ fontFamily: headingFont }}>{title}</h3>

        {/* Category + Marketplace + Seller Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-border/40" style={accent ? { borderColor: `${accent}55`, color: palText || accent } : undefined}>{category}</Badge>
          {marketplaceName && (
            <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">{marketplaceName}</Badge>
          )}
          {displaySeller && (
            <Badge variant="secondary" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">{displaySeller}</Badge>
          )}
        </div>

        {/* Countdown for auctions or timed deals */}
        {status === "auction" && auctionEndsAt && (
          <CountdownTimer endDate={auctionEndsAt} />
        )}
        {status !== "auction" && !noDayLimit && dealEndDate && new Date(dealEndDate) > new Date() && (
          <CountdownTimer endDate={dealEndDate} />
        )}
        {noDayLimit && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Clock className="w-3 h-3" /> No time limit
          </div>
        )}

        {/* Pricing — fixed-height block so single-purchase & group-deal cards align */}
        <div className="space-y-3 min-h-[104px] flex flex-col justify-center">
          {dealType === "single_purchase" ? (
            <div className="rounded-lg bg-secondary/40 p-3 text-center" style={boxStyle}>
              <p className="text-[10px] text-muted-foreground" style={mutedStyle}>Deal Price</p>
              <p className="text-lg font-display font-bold" style={{ color: priceColor }}>${fullPrice.toLocaleString()}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-secondary/40 p-2.5" style={boxStyle}>
                  <p className="text-[10px] text-muted-foreground" style={mutedStyle}>Full Price</p>
                  <p className="text-sm font-display font-bold" style={palText ? { color: palText } : undefined}>${fullPrice.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-2.5" style={boxStyle}>
                  <p className="text-[10px] text-muted-foreground" style={mutedStyle}>Per Spot</p>
                  <p className="text-sm font-display font-bold" style={{ color: priceColor }}>${sharePrice}</p>
                </div>
              </div>

              {/* Spots Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground" style={mutedStyle}>Spots filled</span>
                  <span className="font-medium" style={palText ? { color: palText } : undefined}>{soldShares}/{totalShares} <span className="text-muted-foreground" style={mutedStyle}>({sharesLeft} left)</span></span>
                </div>
                <Progress value={sharePercent} className="h-2 bg-[#2b2b2b] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
              </div>
            </>
          )}
        </div>

        {/* Revenue & Growth */}
        <div className="flex items-center justify-between text-xs text-muted-foreground" style={mutedStyle}>
          <span>+{growthRate}% growth</span>
          <span>${monthlyRevenue}/mo</span>
        </div>

        {/* Buttons */}
        {/* Store context (cart enabled): single-purchase → Add to Cart + Buy Now; group deals → Reserve. */}
        {hasCustomButton ? (
          <div className="flex gap-2 pt-1 mt-auto">
            <Button size="sm" onClick={openCustomButton} disabled={isSold} className={primaryBtnClass} style={primaryBtnStyle}>
              <ExternalLink className="w-3.5 h-3.5" /> {customButton.label || "Learn More"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onViewDetails ? onViewDetails(listing) : navigate(`/saas/${listing.id}`)} className={`${btnShape} text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground`}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        ) : onAddToCart || onBuyNow ? (
          <div className="flex gap-2 pt-1 mt-auto">
            {dealType !== "single_purchase" ? (
              <Button size="sm" onClick={() => onReserveSpot?.(listing)} disabled={isSold || sharesLeft <= 0} className={primaryBtnClass} style={primaryBtnStyle}>
                {sharesLeft <= 0 ? "Sold Out" : "Reserve a Spot"}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => onAddToCart?.(listing)} disabled={isSold} className={`border-orange-500/40 text-orange-400 hover:bg-orange-500/10 ${btnShape} text-[11px] h-8 disabled:opacity-40 px-2.5`} title="Add to cart">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" onClick={() => onBuyNow?.(listing)} disabled={isSold} className={primaryBtnClass} style={primaryBtnStyle}>
                  Buy Now — ${fullPrice.toLocaleString()}
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => onViewDetails ? onViewDetails(listing) : navigate(`/saas/${listing.id}`)} className={`${btnShape} text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground`}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1 mt-auto">
            {(dealType !== "single_purchase") ? (
              <Button size="sm" onClick={() => onBuySpot?.(listing)} disabled={isSold || sharesLeft <= 0} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg text-[11px] h-8 disabled:opacity-40 text-white border-0">
                {sharesLeft <= 0 ? "Sold Out" : `Buy Spot — $${sharePrice}`}
              </Button>
            ) : (
              <Button size="sm" onClick={() => onBuySpot?.(listing)} disabled={isSold} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg text-[11px] h-8 disabled:opacity-40 text-white border-0">
                Buy Now — ${fullPrice.toLocaleString()}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onReserveSpot?.(listing)} disabled={isSold} className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-lg text-[11px] h-8 disabled:opacity-40 px-2.5">
              Reserve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onViewDetails ? onViewDetails(listing) : navigate(`/saas/${listing.id}`)} className="rounded-lg text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Affiliate link — shown to approved affiliates for this product */}
        {affiliateLink && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGrabLink}
            className="w-full mt-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-[11px] h-8"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {linkCopied ? "Link Copied" : "Grab Affiliate Link"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}