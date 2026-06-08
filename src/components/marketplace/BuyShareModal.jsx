import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, TrendingUp, AlertCircle, CheckCircle2, Minus, Plus, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BuyShareModal({ listing, open, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState("");

  if (!listing) return null;

  const sharesLeft = listing.totalShares - listing.soldShares;
  const totalAmount = listing.sharePrice * quantity;
  const isAuctionExpired = listing.status === "auction" && listing.auctionEndsAt && new Date(listing.auctionEndsAt) < new Date();

  const canBuy = listing.status !== "sold" && !isAuctionExpired && quantity > 0 && quantity <= sharesLeft;

  const validateAndGetError = () => {
    if (listing.status === "sold") return "This SaaS has already been sold.";
    if (isAuctionExpired) return "The auction for this listing has expired.";
    if (quantity < 1) return "Please select at least 1 share.";
    if (quantity > sharesLeft) return `Only ${sharesLeft} shares available.`;
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
        alert("Card payment only works from the published app. Please open the app directly.");
        setStripeLoading(false);
        return;
      }

      const res = await base44.functions.invoke("stripeCheckout", {
        listingId: listing.id,
        type: "share",
        quantity,
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
      if (user.walletBalance < totalAmount) {
        setError("Insufficient wallet balance.");
        setLoading(false);
        return;
      }

      // 1. Deduct wallet balance
      await base44.auth.updateMe({ walletBalance: user.walletBalance - totalAmount });

      // 2. Update listing soldShares
      await base44.entities.SaaSListing.update(listing.id, { soldShares: listing.soldShares + quantity });

      // 3. Create SharePurchase record
      await base44.entities.SharePurchase.create({
        userId: user.id,
        listingId: listing.id,
        sharesBought: quantity,
        pricePerShare: listing.sharePrice,
        totalAmount,
      });

      // 4. Create Transaction record
      await base44.entities.Transaction.create({
        userId: user.id,
        type: "share_purchase",
        amount: -totalAmount,
        listingId: listing.id,
        status: "completed",
      });

      toast.success(`Successfully bought ${quantity} share${quantity > 1 ? "s" : ""} for $${totalAmount.toLocaleString()}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Buy Shares</DialogTitle>
          <DialogDescription className="text-xs">{listing.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per share</span>
              <span className="font-bold">${listing.sharePrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available shares</span>
              <span className="font-bold text-emerald-400">{sharesLeft}</span>
            </div>
            <hr className="border-border/30" />
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display font-bold text-[#f79a1b]">${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label className="text-xs">Number of Shares</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-lg border-border/40"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                min={1}
                max={sharesLeft}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(sharesLeft, parseInt(e.target.value) || 1)))}
                className="text-center font-display font-bold text-lg bg-secondary/50 border-border/30 rounded-xl h-9"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-lg border-border/40"
                onClick={() => setQuantity((q) => Math.min(sharesLeft, q + 1))}
                disabled={quantity >= sharesLeft}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => setQuantity(sharesLeft)}>Max: {sharesLeft}</Button>
            </div>
          </div>

          {/* Calculation */}
          <div className="rounded-lg bg-secondary/30 p-3 text-xs space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              {listing.sharePrice} x {quantity} = <span className="font-bold text-[#f79a1b]">${totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-3 h-3" />
              {quantity} share{quantity > 1 ? "s" : ""} of {listing.title}
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
          <Button onClick={handleStripeCheckout} disabled={!canBuy || stripeLoading} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl gap-2 text-white border-0">
            {stripeLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Pay with Card
          </Button>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border/40 rounded-xl" disabled={loading || stripeLoading}>Cancel</Button>
            <Button onClick={handleBuy} disabled={!canBuy || loading || stripeLoading} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl gap-2 text-white border-0 text-xs">
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