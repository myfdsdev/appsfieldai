import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gavel, Clock, TrendingUp, Zap, Users, ArrowUpRight } from "lucide-react";
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

  const handleBidSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["auctionListings"] });
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
            const sharesLeft = listing.totalShares - listing.soldShares;
            const gradient = listing.imageGradient || IMAGE_GRADIENTS[i % IMAGE_GRADIENTS.length];

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-amber-500/30 transition-all group">
                  <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <h3 className="relative text-white font-display font-bold text-lg px-4 text-center">{listing.title}</h3>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className="bg-amber-500/90 text-white text-[10px] border-0"><Gavel className="w-3 h-3 mr-1" /> Live</Badge>
                      {(listing.bids?.length > 5) && <Badge className="bg-red-500/90 text-white text-[10px] border-0">Hot</Badge>}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Full Price</p>
                        <p className="font-display font-bold text-sm">${listing.fullPrice?.toLocaleString()}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Per Share</p>
                        <p className="font-display font-bold text-sm text-cyan-400">${listing.sharePrice}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Growth</p>
                        <p className="font-display font-bold text-sm text-emerald-400">+{listing.growthRate}%</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Shares Sold</span>
                        <span>{listing.soldShares}/{listing.totalShares} <span className="text-muted-foreground">({sharesLeft} left)</span></span>
                      </div>
                      <Progress value={(listing.soldShares / listing.totalShares) * 100} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {listing.auctionEndsAt ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <CountdownTimer endDate={listing.auctionEndsAt} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>No end date</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-[10px] border-border/40">{listing.category}</Badge>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl h-9 text-sm font-semibold"
                      onClick={() => setBidListing(listing)}
                    >
                      <Gavel className="w-4 h-4 mr-2" /> Place Bid
                    </Button>
                  </CardContent>
                </Card>
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