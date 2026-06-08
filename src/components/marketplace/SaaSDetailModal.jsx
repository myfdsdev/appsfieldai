import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Star, TrendingUp, Clock, Gavel, Shield, Bot, Zap, Building2, DollarSign, FileText, Users, ChevronLeft, ChevronRight, Images } from "lucide-react";
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

const DEMO_SLIDES = [
  { src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&crop=edges", label: "Dashboard Overview" },
  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&crop=edges", label: "Analytics Screen" },
  { src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop&crop=edges", label: "Revenue Overview" },
  { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop&crop=edges", label: "Team Dashboard" },
];

function ImageSlider({ images, gradient, title }) {
  const [current, setCurrent] = useState(0);
  const slides = (images && images.length > 0) ? images : DEMO_SLIDES.map((s) => s.src);
  const slideLabels = (images && images.length > 0) ? null : DEMO_SLIDES.map((s) => s.label);
  const isMulti = slides.length > 1;

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative h-52 sm:h-64 rounded-xl overflow-hidden bg-secondary/40 group">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={slides[current]}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="w-full h-full object-cover"
          alt={slideLabels ? slideLabels[current] : `Slide ${current + 1}`}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      {isMulti && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SaaSDetailModal({ listingId, open, onClose }) {
  const queryClient = useQueryClient();
  const [buyShareListing, setBuyShareListing] = useState(null);
  const [buyFullListing, setBuyFullListing] = useState(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["saasListing", listingId],
    queryFn: async () => {
      const items = await base44.entities.SaaSListing.filter({ id: listingId });
      return items[0] || null;
    },
    enabled: !!listingId && open,
  });

  const { data: sharePurchases = [] } = useQuery({
    queryKey: ["sharePurchases", listingId],
    queryFn: () => base44.entities.SharePurchase.filter({ listingId }, ["-created_date"], 5),
    enabled: !!listing,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids", listingId],
    queryFn: () => base44.entities.Bid.filter({ listingId }, ["-bidAmount"], 5),
    enabled: !!listing?.status === "auction",
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["saasListing", listingId] });
    queryClient.invalidateQueries({ queryKey: ["saasListings"] });
  };

  if (!open) return null;

  const sharesLeft = listing ? listing.totalShares - listing.soldShares : 0;
  const monthlyProfit = listing ? listing.monthlyRevenue - (listing.monthlyExpenses || 0) : 0;
  const isSold = listing?.status === "sold";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-4xl bg-card border border-border/40 rounded-2xl shadow-2xl z-10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : !listing ? (
              <div className="text-center py-20">
                <p className="text-lg font-display text-muted-foreground">Listing not found</p>
              </div>
            ) : (
              <div className="max-h-[85vh] overflow-y-auto">
                {/* Hero Image */}
                <ImageSlider images={listing.images} gradient={listing.imageGradient} title={listing.title} />

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Header */}
                  <div>
                    <h2 className="text-xl font-display font-bold">{listing.title}</h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-border/40">{listing.category}</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{listing.rating}</span>
                      </div>
                      {listing.status === "auction" && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"><Gavel className="w-3 h-3 mr-1" /> Auction</Badge>
                      )}
                      {isSold && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Sold</Badge>}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-5">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Scores Row */}
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[10px] border ${listing.riskScore <= 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : listing.riskScore <= 6 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} flex items-center gap-1`}>
                          <Shield className="w-3 h-3" /> Risk: {listing.riskScore}/10
                        </Badge>
                        <Badge className="text-[10px] border bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AI: {listing.aiScore}%
                        </Badge>
                      </div>

                      {/* Description */}
                      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> About</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">{listing.description || "No description provided."}</p>
                          {(listing.tags?.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {listing.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Financial Overview */}
                      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Financial Overview</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
                              <p className="text-sm font-display font-bold text-emerald-400">${listing.monthlyRevenue?.toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Expenses</p>
                              <p className="text-sm font-display font-bold text-red-400">${(listing.monthlyExpenses || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl bg-secondary/40 p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase">Profit</p>
                              <p className="text-sm font-display font-bold text-cyan-400">${monthlyProfit.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs mt-3 text-muted-foreground">
                            <span>Growth Rate</span>
                            <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{listing.growthRate}%</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Key Features */}
                      {(listing.features?.length > 0) && (
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Key Features</CardTitle></CardHeader>
                          <CardContent>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {listing.features.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <div className="w-5 h-5 rounded-lg bg-violet-500/10 flex items-center justify-center"><Zap className="w-3 h-3 text-violet-400" /></div>
                                  {f}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Revenue Proof */}
                      {(listing.revenueProofFiles?.length > 0) && (
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Revenue Proof</CardTitle></CardHeader>
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

                      {/* Recent Purchases */}
                      {sharePurchases.length > 0 && (
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><Users className="w-4 h-4 text-orange-400" /> Recent Purchases</CardTitle></CardHeader>
                          <CardContent className="divide-y divide-border/30">
                            {sharePurchases.map((p) => (
                              <div key={p.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                                <div>
                                  <p className="text-xs"><span className="font-medium">Investor</span> bought {p.sharesBought} share{p.sharesBought > 1 ? "s" : ""}</p>
                                  <p className="text-[10px] text-muted-foreground">{new Date(p.created_date).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs font-medium text-emerald-400">${p.totalAmount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Bids */}
                      {bids.length > 0 && (
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" /> Recent Bids</CardTitle></CardHeader>
                          <CardContent className="divide-y divide-border/30">
                            {bids.map((b) => (
                              <div key={b.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                                <div>
                                  <p className="text-xs font-medium">Bidder</p>
                                  <p className="text-[10px] text-muted-foreground">{new Date(b.created_date).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs font-display font-bold text-amber-400">${b.bidAmount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      <Card className="border-orange-500/20 bg-card/60 backdrop-blur-xl sticky top-4">
                        <CardContent className="p-4 space-y-4">
                          {/* Pricing */}
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-xl bg-secondary/40 p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase">Full Price</p>
                              <p className="text-base font-display font-bold">${listing.fullPrice?.toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl bg-secondary/40 p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase">Per Share</p>
                              <p className="text-base font-display font-bold text-cyan-400">${listing.sharePrice}</p>
                            </div>
                          </div>

                          {/* Shares Progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Shares</span>
                              <span className="font-medium">{listing.soldShares}/{listing.totalShares} <span className="text-muted-foreground">({sharesLeft} left)</span></span>
                            </div>
                            <Progress value={(listing.soldShares / listing.totalShares) * 100} className="h-2 bg-[#2b2b2b] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
                          </div>

                          {/* Metrics */}
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Seller</span>
                              <span className="font-medium">{listing.sellerName || "Anonymous"}</span>
                            </div>
                          </div>

                          {/* Auction Countdown */}
                          {listing.status === "auction" && listing.auctionEndsAt && (
                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-2.5">
                              <p className="text-[10px] text-amber-400 uppercase mb-1">Auction Ends In</p>
                              <CountdownTimer endDate={listing.auctionEndsAt} />
                            </div>
                          )}

                          {/* Action Buttons */}
                          {!isSold && (
                            <div className="space-y-2 pt-1">
                              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl h-9 font-semibold text-xs text-white border-0" onClick={() => setBuyShareListing(listing)}>
                                <DollarSign className="w-4 h-4 mr-1.5" /> Buy Shares
                              </Button>
                              <Button variant="outline" className="w-full border-orange-500/60 text-orange-400 hover:bg-orange-500/10 rounded-xl h-9 text-xs" onClick={() => setBuyFullListing(listing)}>
                                <Building2 className="w-4 h-4 mr-1.5" /> Full Ownership
                              </Button>
                            </div>
                          )}

                          {isSold && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                              <p className="text-red-400 font-display font-bold">Sold</p>
                              <p className="text-[10px] text-muted-foreground mt-1">This SaaS has been purchased</p>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 pt-1">
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-muted-foreground">Verified &amp; Secured by SaaSShare</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Modals (nested inside portal) */}
            <BuyShareModal listing={buyShareListing} open={!!buyShareListing} onClose={() => setBuyShareListing(null)} onSuccess={handleSuccess} />
            <FullOwnershipModal listing={buyFullListing} open={!!buyFullListing} onClose={() => setBuyFullListing(null)} onSuccess={handleSuccess} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}