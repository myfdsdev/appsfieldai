import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  X, Star, TrendingUp, Clock, Gavel, Shield, Bot, Zap, Building2,
  CalendarCheck, DollarSign, FileText, Users, ChevronLeft, ChevronRight, Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ReserveSpotModal from "@/components/marketplace/ReserveSpotModal";
import RequestAcquisitionModal from "@/components/marketplace/RequestAcquisitionModal";
import PlaceBidModal from "@/components/marketplace/PlaceBidModal";

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
  const urgent = days === 0 && hours < 6;
  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${urgent ? "text-red-400" : "text-amber-400"}`}>
      <Clock className="w-3 h-3" />
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
    </div>
  );
}

const DEMO_SLIDES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=600&fit=crop",
];

function ImageSlider({ images }) {
  const [current, setCurrent] = useState(0);
  const slides = images && images.length > 0 ? images : DEMO_SLIDES;

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative w-full h-full bg-black/20 group">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={slides[current]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
          alt={`Slide ${current + 1}`}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Prev Arrow */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:scale-110 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next Arrow */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:scale-110 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SaaSDetailModal({ listingId, open, onClose }) {
  const queryClient = useQueryClient();
  const [reserveSpotListing, setReserveSpotListing] = useState(null);
  const [requestAcqListing, setRequestAcqListing] = useState(null);
  const [placeBidListing, setPlaceBidListing] = useState(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["saasListing", listingId],
    queryFn: async () => {
      const all = await base44.entities.SaaSListing.list();
      return all.find((l) => l.id === listingId) || null;
    },
    enabled: !!listingId && open,
  });

  const { data: sharePurchases = [] } = useQuery({
    queryKey: ["sharePurchases", listingId],
    queryFn: () => base44.entities.SharePurchase.filter({ listingId }, ["-created_date"], 5),
    enabled: !!listing,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["saasListing", listingId] });
    queryClient.invalidateQueries({ queryKey: ["saasListings"] });
  };

  if (!open) return null;

  const isSold = listing?.status === "sold";
  const sharesLeft = listing ? listing.totalShares - listing.soldShares : 0;
  const monthlyProfit = listing ? listing.monthlyRevenue - (listing.monthlyExpenses || 0) : 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-4xl bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden flex"
            style={{ height: "min(580px, 90vh)" }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : !listing ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground font-display">Listing not found</p>
              </div>
            ) : (
              <>
                {/* LEFT — Image Slider (60%) */}
                <div className="w-[58%] flex-shrink-0 h-full">
                  <ImageSlider images={listing.images} />
                </div>

                {/* RIGHT — Details (40%) */}
                <div className="flex-1 h-full overflow-y-auto flex flex-col p-5 space-y-4">
                  {/* Title & Category */}
                  <div className="pr-6">
                    <h2 className="text-lg font-display font-bold leading-snug">{listing.softwareName || listing.title}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-border/40">{listing.category}</Badge>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{listing.rating}</span>
                      </div>
                      {listing.status === "auction" && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          <Gavel className="w-3 h-3 mr-1" /> Auction
                        </Badge>
                      )}
                      {isSold && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Sold</Badge>}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] border ${listing.riskScore <= 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : listing.riskScore <= 6 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} flex items-center gap-1`}>
                      <Shield className="w-3 h-3" /> Risk {listing.riskScore}/10
                    </Badge>
                    <Badge className="text-[10px] border bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> AI {listing.aiScore}%
                    </Badge>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{listing.growthRate}%
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">About this SaaS</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{listing.shortDescription || listing.fullDescription || listing.description || "No description provided."}</p>
                  </div>

                  {/* Tags */}
                  {listing.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {listing.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Financials */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">Revenue</p>
                      <p className="text-xs font-display font-bold text-emerald-400">${listing.monthlyRevenue?.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">/mo</p>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">Profit</p>
                      <p className="text-xs font-display font-bold text-[#f79a1b]">${monthlyProfit.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">/mo</p>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">Full Price</p>
                      <p className="text-xs font-display font-bold">${((listing.sharePrice || 0) * (listing.totalShares || 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Share Price & Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Per Share: <span className="text-[#f79a1b] font-bold">${listing.sharePrice}</span></span>
                      <span className="text-muted-foreground">{listing.soldShares}/{listing.totalShares} sold</span>
                    </div>
                    <Progress value={(listing.soldShares / listing.totalShares) * 100} className="h-1.5 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
                    <p className="text-[10px] text-muted-foreground">{sharesLeft} shares remaining</p>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-medium">{listing.sellerName || "Anonymous"}</span>
                  </div>

                  {/* Auction countdown */}
                  {listing.status === "auction" && listing.auctionEndsAt && (
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-2.5">
                      <p className="text-[9px] text-amber-400 uppercase mb-1">Auction Ends In</p>
                      <CountdownTimer endDate={listing.auctionEndsAt} />
                    </div>
                  )}

                  {/* Recent purchases */}
                  {sharePurchases.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Recent Investors
                      </p>
                      <div className="space-y-1.5">
                        {sharePurchases.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>Investor bought {p.sharesBought} share{p.sharesBought > 1 ? "s" : ""}</span>
                            <span className="text-emerald-400">${p.totalAmount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Action Buttons */}
                  {!isSold ? (
                    <div className="space-y-2 pt-1">
                      {listing.status === "auction" && (
                        <Button
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl h-9 font-semibold text-sm text-white border-0"
                          onClick={() => setPlaceBidListing(listing)}
                        >
                          <Gavel className="w-4 h-4 mr-1.5" /> Place Bid
                        </Button>
                      )}
                      <Button
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl h-9 font-semibold text-sm text-white border-0"
                        onClick={() => setReserveSpotListing(listing)}
                      >
                        <CalendarCheck className="w-4 h-4 mr-1.5" /> Reserve Spot
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-violet-500/50 text-violet-400 hover:bg-violet-500/10 rounded-xl h-9 text-sm"
                        onClick={() => setRequestAcqListing(listing)}
                      >
                        <Building2 className="w-4 h-4 mr-1.5" /> Request Acquisition
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                      <p className="text-red-400 font-display font-bold">Sold Out</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">This SaaS has been fully purchased</p>
                    </div>
                  )}

                  {/* Trust line */}
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-muted-foreground">Verified &amp; Secured by SaaSShare</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      <ReserveSpotModal listing={reserveSpotListing} open={!!reserveSpotListing} onClose={() => setReserveSpotListing(null)} />
      <RequestAcquisitionModal listing={requestAcqListing} open={!!requestAcqListing} onClose={() => setRequestAcqListing(null)} />
      <PlaceBidModal listing={placeBidListing} open={!!placeBidListing} onClose={() => setPlaceBidListing(null)} />
    </AnimatePresence>
  );
}