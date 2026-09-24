import React from "react";
import { Star, ShieldCheck, Zap } from "lucide-react";
import SalesGallery from "@/components/store/salespage/SalesGallery";
import SalesCta from "@/components/store/salespage/SalesCta";
import SalesCountdown from "@/components/store/salespage/SalesCountdown";

// Above-the-fold: media gallery + title, pitch, price, countdown and buy button.
export default function SalesHero({ listing, t, priceLabel, onBuy }) {
  const showTimer = !listing.noDayLimit && listing.dealEndDate;
  return (
    <section className="max-w-6xl mx-auto px-5 pt-8 pb-12 grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-12 items-start">
      <SalesGallery listing={listing} cardStyle={t.cardStyle} />
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {listing.category && <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: `${t.accent}22`, color: t.accent }}>{listing.category}</span>}
          {listing.isLifetimeDeal && <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-500">Lifetime Deal</span>}
          {listing.rating > 0 && (
            <span className="flex items-center gap-1 font-medium"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{listing.rating}</span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight" style={t.headingStyle}>{listing.softwareName}</h1>
        {listing.shortDescription && <p className="text-base md:text-lg opacity-80 leading-relaxed">{listing.shortDescription}</p>}

        <div>
          <p className="text-xs uppercase font-semibold opacity-60">{listing.pricingType === "subscription" ? "Price" : "One-time price"}</p>
          <p className="text-4xl font-display font-bold" style={{ color: t.accent }}>{priceLabel}</p>
        </div>

        {showTimer && <SalesCountdown endDate={listing.dealEndDate} />}

        <SalesCta listing={listing} priceLabel={priceLabel} accent={t.accent} accentText={t.accentText} onBuy={onBuy} className="w-full h-12 text-base" />

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs opacity-75">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure checkout</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" style={{ color: t.accent }} /> Access details by email</span>
        </div>
      </div>
    </section>
  );
}