import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { Users, DollarSign, Minus, Plus, Loader2, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

export default function BuySpotModal({ listing, open, onClose, onSuccess }) {
  const [spots, setSpots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (open) {
      setSpots(1);
      base44.auth.me().then(setUser).catch(() => setUser(null));
    }
  }, [open]);

  if (!listing) return null;

  const spotsLeft = (listing.totalShares || 0) - (listing.soldShares || 0);
  const pricePerSpot = listing.sharePrice || 0;
  const totalPrice = pricePerSpot * spots;
  const progressPct = listing.totalShares > 0 ? ((listing.soldShares || 0) / listing.totalShares) * 100 : 0;

  const handleBuySpot = async () => {
    if (!user) { toast.error("Please login to buy a spot"); return; }
    if (spots < 1 || spots > spotsLeft) { toast.error(`Select between 1 and ${spotsLeft} spots`); return; }

    setLoading(true);
    try {
      const res = await base44.functions.invoke("processDealPurchase", {
        listingId: listing.id,
        spots,
        purchaseType: "spot",
      });

      if (res.data?.success) {
        toast.success(`Successfully reserved ${spots} spot(s) for $${totalPrice.toLocaleString()}!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.error || "Purchase failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  const handleBuyFull = async () => {
    if (!user) { toast.error("Please login to buy"); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("processDealPurchase", {
        listingId: listing.id,
        purchaseType: "full",
      });

      if (res.data?.success) {
        toast.success(`Full deal purchased for $${(listing.price || 0).toLocaleString()}!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.error || "Purchase failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{listing.softwareName}</DialogTitle>
          <DialogDescription>Join this group deal and save on premium software</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Deal Progress */}
          <div className="p-4 rounded-xl bg-secondary/30 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Spots filled</span>
              <span className="font-medium">{listing.soldShares || 0}/{listing.totalShares} <span className="text-muted-foreground">({spotsLeft} left)</span></span>
            </div>
            <Progress value={progressPct} className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
          </div>

          {/* Spot Selector */}
          {(listing.dealType !== "single_purchase") && spotsLeft > 0 && (
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">How many spots?</label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setSpots(Math.max(1, spots - 1))} disabled={spots <= 1} className="rounded-xl h-10 w-10 border-border/40">
                  <Minus className="w-4 h-4" />
                </Button>
                <Input type="number" value={spots} onChange={e => setSpots(Math.max(1, Math.min(spotsLeft, parseInt(e.target.value) || 1)))} min={1} max={spotsLeft} className="w-20 text-center bg-secondary/50 border-border/30 rounded-xl text-lg font-bold" />
                <Button variant="outline" size="icon" onClick={() => setSpots(Math.min(spotsLeft, spots + 1))} disabled={spots >= spotsLeft} className="rounded-xl h-10 w-10 border-border/40">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Price Summary */}
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{spots} spot(s) × ${pricePerSpot}</span>
                  <span className="font-display font-bold text-orange-400">${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button onClick={handleBuySpot} disabled={loading || spotsLeft === 0} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl h-10 font-semibold text-white border-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                Buy {spots} Spot{spots > 1 ? "s" : ""} — ${totalPrice.toLocaleString()}
              </Button>
            </div>
          )}

          {/* Full Purchase Option */}
          {(listing.dealType === "single_purchase" || listing.dealType === "both") && (
            <>
              {listing.dealType === "both" && <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>}
              <Button onClick={handleBuyFull} disabled={loading} variant={listing.dealType === "both" ? "outline" : "default"}
                className={`w-full rounded-xl h-10 font-semibold ${listing.dealType !== "both" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0" : "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"}`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Buy Full Deal — ${(listing.price || 0).toLocaleString()}
              </Button>
            </>
          )}

          {spotsLeft === 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-display font-bold">Fully Funded! 🎉</p>
              <p className="text-[11px] text-muted-foreground mt-1">All spots have been filled</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}