import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, AlertCircle, CheckCircle2, Building2, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function FullOwnershipModal({ listing, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState("");

  if (!listing) return null;

  const isAuctionExpired = listing.status === "auction" && listing.auctionEndsAt && new Date(listing.auctionEndsAt) < new Date();

  const validateAndGetError = () => {
    if (listing.status === "sold") return "This SaaS has already been sold.";
    if (listing.status === "draft") return "This listing is not yet published.";
    if (isAuctionExpired) return "The auction for this listing has expired.";
    return "";
  };

  const handleStripeCheckout = async () => {
    const validationError = validateAndGetError();
    if (validationError) { setError(validationError); return; }

    setStripeLoading(true);
    setError("");

    try {
      const inIframe = window.self !== window.top;
      if (inIframe) {
        setError("Card payment only works from the published app. Please open the app directly.");
        setStripeLoading(false);
        return;
      }

      const res = await base44.functions.invoke("stripeCheckout", {
        listingId: listing.id,
        type: "ownership",
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError("Could not start checkout. Try again.");
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
    } finally {
      setStripeLoading(false);
    }
  };

  const handleBuy = async () => {
    const validationError = validateAndGetError();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      const user = await base44.auth.me();
      if (user.walletBalance < listing.fullPrice) {
        setError(`Insufficient wallet balance. You need $${listing.fullPrice.toLocaleString()} but have $${(user.walletBalance || 0).toLocaleString()}.`);
        setLoading(false);
        return;
      }

      // 1. Deduct wallet balance
      await base44.auth.updateMe({ walletBalance: user.walletBalance - listing.fullPrice });

      // 2. Set listing as sold
      await base44.entities.SaaSListing.update(listing.id, {
        status: "sold",
        fullOwnerUserId: user.id,
        soldShares: listing.totalShares,
      });

      // 3. Create OwnershipPurchase record
      await base44.entities.OwnershipPurchase.create({
        userId: user.id,
        listingId: listing.id,
        fullPrice: listing.fullPrice,
      });

      // 4. Create Transaction record
      await base44.entities.Transaction.create({
        userId: user.id,
        type: "ownership_purchase",
        amount: -listing.fullPrice,
        listingId: listing.id,
        status: "completed",
      });

      toast.success(`You now own ${listing.title}! Full ownership purchased for $${listing.fullPrice.toLocaleString()}.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const monthlyProfit = listing.monthlyRevenue - (listing.monthlyExpenses || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Buy Full Ownership</DialogTitle>
          <DialogDescription className="text-xs">You're about to purchase the entire SaaS business</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Listing Summary */}
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-400" />
              <span className="font-display font-bold text-base">{listing.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground">Monthly Revenue</p>
                <p className="font-bold text-emerald-400">${listing.monthlyRevenue?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Monthly Profit</p>
                <p className="font-bold text-[#f79a1b]">${monthlyProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Full Ownership Price</span>
              <span className="font-display font-bold text-xl text-[#f79a1b]">${listing.fullPrice?.toLocaleString()}</span>
            </div>
            <hr className="border-border/30" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              ROI at current revenue: ~{listing.monthlyRevenue ? Math.round(listing.fullPrice / listing.monthlyRevenue) : "N/A"} months
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={handleStripeCheckout}
            disabled={listing.status === "sold" || stripeLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl gap-2 text-white border-0"
          >
            {stripeLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Pay with Card
          </Button>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border/40 rounded-xl" disabled={loading || stripeLoading}>Cancel</Button>
            <Button
              onClick={handleBuy}
              disabled={listing.status === "sold" || loading || stripeLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl gap-2 text-white border-0 text-xs"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Wallet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}