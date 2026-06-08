import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Star, TrendingUp, Clock, Gavel, Shield, Bot, Zap, Building2, DollarSign, FileText, Users, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BuyShareModal from "@/components/marketplace/BuyShareModal";
import FullOwnershipModal from "@/components/marketplace/FullOwnershipModal";

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
    <div className={`flex items-center gap-2 text-sm font-mono font-bold ${urgent ? "text-red-400" : "text-amber-400"}`}>
      <Clock className="w-4 h-4" />
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
    </div>
  );
}

function ImageSlider({ images, gradient, title }) {
  const [current, setCurrent] = useState(0);
  const hasImages = images && images.length > 0;

  if (!hasImages) {
    return (
      <div className={`h-64 rounded-2xl bg-gradient-to-br ${gradient || "from-violet-600 to-purple-700"} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative text-center">
          <h2 className="text-3xl font-display font-bold text-white drop-shadow-lg">{title}</h2>
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative h-64 rounded-2xl overflow-hidden bg-secondary/40 group">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/40"}`} />
            ))}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Images className="w-3 h-3 text-white/70" />
            <span className="text-white text-[11px] font-medium">{current + 1}/{images.length}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function SaaSDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [buyShareListing, setBuyShareListing] = useState(null);
  const [buyFullListing, setBuyFullListing] = useState(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["saasListing", id],
    queryFn: async () => {
      const items = await base44.entities.SaaSListing.filter({ id });
      return items[0] || null;
    },
  });

  const { data: sharePurchases = [] } = useQuery({
    queryKey: ["sharePurchases", id],
    queryFn: () => base44.entities.SharePurchase.filter({ listingId: id }, ["-created_date"], 10),
    enabled: !!listing,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids", id],
    queryFn: () => base44.entities.Bid.filter({ listingId: id }, ["-bidAmount"], 10),
    enabled: !!listing?.status === "auction",
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["saasListing", id] });
    queryClient.invalidateQueries({ queryKey: ["saasListings"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-display text-muted-foreground">Listing not found</p>
        <Button variant="link" onClick={() => window.history.back()} className="mt-2">Go back</Button>
      </div>
    );
  }

  const sharesLeft = listing.totalShares - listing.soldShares;
  const monthlyProfit = listing.monthlyRevenue - (listing.monthlyExpenses || 0);
  const isSold = listing.status === "sold";

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{listing.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-border/40">{listing.category}</Badge>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium">{listing.rating}</span>
            </div>
            {listing.status === "auction" && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"><Gavel className="w-3 h-3 mr-1" /> Auction</Badge>
            )}
            {isSold && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Sold</Badge>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Slider */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ImageSlider images={listing.images} gradient={listing.imageGradient} title={listing.title} />
          </motion.div>

          {/* Description */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> About This SaaS</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description || "No description provided."}</p>
              {(listing.tags?.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {listing.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Financial Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-secondary/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Monthly Revenue</p>
                  <p className="text-lg font-display font-bold text-emerald-400">${listing.monthlyRevenue?.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Monthly Expenses</p>
                  <p className="text-lg font-display font-bold text-red-400">${(listing.monthlyExpenses || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Monthly Profit</p>
                  <p className="text-lg font-display font-bold text-cyan-400">${monthlyProfit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          {(listing.features?.length > 0) && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Key Features</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {listing.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><Zap className="w-3 h-3 text-violet-400" /></div>
                      {f}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue Proof Files */}
          {(listing.revenueProofFiles?.length > 0) && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Revenue Proof</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.revenueProofFiles.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <Badge variant="outline" className="cursor-pointer border-cyan-500/20 text-cyan-400 text-[10px] hover:bg-cyan-500/10">Document {i + 1}</Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Share Purchases */}
          {sharePurchases.length > 0 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /> Recent Share Purchases</CardTitle></CardHeader>
              <CardContent className="divide-y divide-border/30">
                {sharePurchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm"><span className="font-medium">Investor</span> bought {p.sharesBought} share{p.sharesBought > 1 ? "s" : ""}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(p.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-medium text-emerald-400">${p.totalAmount?.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Bids */}
          {bids.length > 0 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" /> Recent Bids</CardTitle></CardHeader>
              <CardContent className="divide-y divide-border/30">
                {bids.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">Bidder</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(b.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-display font-bold text-amber-400">${b.bidAmount?.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-violet-500/20 bg-card/60 backdrop-blur-xl sticky top-24">
              <CardContent className="p-6 space-y-5">
                {/* Scores */}
                <div className="flex items-center gap-3">
                  <Badge className={`text-[10px] border ${listing.riskScore <= 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : listing.riskScore <= 6 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} flex items-center gap-1`}>
                    <Shield className="w-3 h-3" /> Risk: {listing.riskScore}/10
                  </Badge>
                  <Badge className="text-[10px] border bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> AI: {listing.aiScore}%
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Full Price</p>
                    <p className="text-xl font-display font-bold mt-1">${listing.fullPrice?.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Per Share</p>
                    <p className="text-xl font-display font-bold text-cyan-400 mt-1">${listing.sharePrice}</p>
                  </div>
                </div>

                {/* Shares Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-medium">{listing.soldShares}/{listing.totalShares} <span className="text-muted-foreground">({sharesLeft} left)</span></span>
                  </div>
                  <Progress value={(listing.soldShares / listing.totalShares) * 100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-500" />
                </div>

                {/* Metrics */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth Rate</span>
                    <span className="font-medium text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{listing.growthRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Profit</span>
                    <span className="font-medium text-cyan-400">${monthlyProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-medium">{listing.sellerName || "Anonymous"}</span>
                  </div>
                </div>

                {/* Auction Countdown */}
                {listing.status === "auction" && listing.auctionEndsAt && (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                    <p className="text-[10px] text-amber-400 uppercase mb-1">Auction Ends In</p>
                    <CountdownTimer endDate={listing.auctionEndsAt} />
                  </div>
                )}

                {/* Action Buttons */}
                {!isSold && (
                  <div className="space-y-2 pt-2">
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl h-10 font-semibold text-sm" onClick={() => setBuyShareListing(listing)}>
                      <DollarSign className="w-4 h-4 mr-2" /> Buy Shares
                    </Button>
                    <Button variant="outline" className="w-full border-violet-500/20 text-violet-400 hover:bg-violet-500/10 rounded-xl h-10 text-sm" onClick={() => setBuyFullListing(listing)}>
                      <Building2 className="w-4 h-4 mr-2" /> Full Ownership
                    </Button>
                    {listing.status === "auction" && (
                      <Button variant="outline" className="w-full border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl h-10 text-sm">
                        <Gavel className="w-4 h-4 mr-2" /> Place Bid
                      </Button>
                    )}
                  </div>
                )}

                {isSold && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                    <p className="text-red-400 font-display font-bold text-lg">Sold</p>
                    <p className="text-xs text-muted-foreground mt-1">This SaaS has been purchased</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] text-muted-foreground">Verified &amp; Secured by SaaSShare</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <BuyShareModal listing={buyShareListing} open={!!buyShareListing} onClose={() => setBuyShareListing(null)} onSuccess={handleSuccess} />
      <FullOwnershipModal listing={buyFullListing} open={!!buyFullListing} onClose={() => setBuyFullListing(null)} onSuccess={handleSuccess} />
    </div>
  );
}