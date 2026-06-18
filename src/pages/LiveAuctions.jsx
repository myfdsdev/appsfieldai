import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gavel, Clock, TrendingUp, Zap, Users, ArrowUpRight } from "lucide-react";
import { useAuthGate } from "@/hooks/useAuthGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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
  const urgent = days === 0 && hours < 2;
  return (
    <span className={urgent ? "text-red-400" : "text-amber-400"}>
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
    </span>
  );
}

const IMAGE_GRADIENTS = [
  "from-emerald-600 to-green-700",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-blue-700",
  "from-orange-600 to-amber-600",
  "from-amber-600 to-orange-700",
  "from-indigo-600 to-blue-700",
];

export default function LiveAuctions() {
  const queryClient = useQueryClient();
  const [bidListing, setBidListing] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["auctionListings"],
    queryFn: () => base44.entities.SaaSListing.filter({ status: "auction" }),
  });

  const authGate = useAuthGate();

  const handleBidSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["auctionListings"] });
  };

  const handlePlaceBid = async (listing) => {
    if (await authGate()) setBidListing(listing);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Live Auctions</h1>
        <p className="text-sm text-muted-foreground mt-1">Bid on premium SaaS shares before auctions close.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <Gavel className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-lg font-display text-muted-foreground mt-4">No active auctions</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later for new listings.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing, i) => {
            const totalShares = listing.totalShares || 0;
            const soldShares = listing.soldShares || 0;
            const sharesLeft = totalShares - soldShares;
            const sharePercent = totalShares > 0 ? (soldShares / totalShares) * 100 : 0;
            const gradient = listing.imageGradient || IMAGE_GRADIENTS[i % IMAGE_GRADIENTS.length];

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="rounded-2xl overflow-hidden border border-border/30 bg-[#1a1a1a] hover:border-amber-500/40 transition-all duration-300 group shadow-lg shadow-black/20">
                  {/* Top Header - Gradient Background */}
                  <div className={`h-32 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_70%)]" />
                    <h3 className="relative text-white font-display font-bold text-xl px-6 text-center drop-shadow-md">{listing.softwareName || "Untitled"}</h3>
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 bg-[#FF8C00] text-white text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-md">
                        <Gavel className="w-3 h-3" /> Live
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#222] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Full Price</p>
                        <p className="font-display font-bold text-sm text-white">${((listing.sharePrice || 0) * (listing.totalShares || 0)).toLocaleString()}</p>
                      </div>
                      <div className="bg-[#222] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Per Share</p>
                        <p className="font-display font-bold text-sm text-cyan-400">${listing.sharePrice || 0}</p>
                      </div>
                      <div className="bg-[#222] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Growth</p>
                        <p className="font-display font-bold text-sm text-emerald-400">+{listing.growthRate || 0}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Shares Sold</span>
                        <span className="text-white font-medium">{soldShares}/{totalShares} <span className="text-muted-foreground font-normal">({sharesLeft} left)</span></span>
                      </div>
                      <div className="h-2 bg-[#2b2b2b] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#FFa033]" style={{ width: `${Math.min(100, sharePercent)}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {listing.auctionEndsAt ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/80">
                          <Clock className="w-3.5 h-3.5" />
                          <CountdownTimer endDate={listing.auctionEndsAt} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>No end date</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">{listing.category}</Badge>
                    </div>

                    {/* Place Bid Button */}
                    <Button
                      className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl h-10 text-sm font-semibold border-0 shadow-lg shadow-orange-500/20"
                      onClick={() => handlePlaceBid(listing)}
                    >
                      <Gavel className="w-4 h-4 mr-2" /> Place Bid
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <PlaceBidModal
        listing={bidListing}
        open={!!bidListing}
        onClose={() => setBidListing(null)}
        onSuccess={handleBidSuccess}
      />
    </div>
  );
}