import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, DollarSign, AlertCircle, Clock, Users, Zap, TrendingUp, History, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function CountdownTimer({ endDate }) {
  const target = new Date(endDate).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endDate) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endDate]);
  if (!endDate) return <span className="text-muted-foreground">No end date</span>;
  const diff = Math.max(0, target - now);
  if (diff === 0) return <span className="text-red-400 font-semibold">Ended</span>;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const urgent = days === 0 && hours < 2;
  return (
    <span className={urgent ? "text-red-400 font-semibold" : "text-amber-400"}>
      {days > 0 && `${days}d `}{String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </span>
  );
}

export default function PlaceBidModal({ listing, open, onClose, onSuccess }) {
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [bids, setBids] = useState([]);
  const [userId, setUserId] = useState(null);

  // Fetch bids for this listing
  useEffect(() => {
    if (!listing?.id) return;
    base44.entities.Bid.filter({ listingId: listing.id }, "-created_date").then(setBids).catch(() => {});
    base44.auth.me().then((u) => u && setUserId(u.id)).catch(() => {});
  }, [listing?.id]);

  const sharePrice = listing?.sharePrice || 10;
  const fullPrice = listing?.fullPrice || 0;

  const highestBid = useMemo(() => {
    if (!bids.length) return 0;
    return Math.max(...bids.map((b) => b.bidAmount));
  }, [bids]);

  const minNextBid = useMemo(() => {
    if (highestBid === 0) return sharePrice * 0.5;
    return Math.ceil(highestBid * 1.05);
  }, [highestBid, sharePrice]);

  const totalBidders = useMemo(() => {
    const ids = new Set(bids.map((b) => b.userId));
    return ids.size;
  }, [bids]);

  const userRank = useMemo(() => {
    if (!userId || !bids.length) return null;
    const userBids = bids.filter((b) => b.userId === userId);
    if (!userBids.length) return null;
    const sorted = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
    const rank = sorted.findIndex((b) => b.userId === userId);
    return rank >= 0 ? rank + 1 : null;
  }, [bids, userId]);

  const estimatedSaving = useMemo(() => {
    if (!fullPrice || !sharePrice) return null;
    return fullPrice - sharePrice;
  }, [fullPrice, sharePrice]);

  const bidHistory = useMemo(() => {
    return [...bids]
      .sort((a, b) => b.bidAmount - a.bidAmount)
      .slice(0, 3);
  }, [bids]);

  const isExpired = useMemo(() => {
    if (!listing?.auctionEndsAt) return false;
    return new Date(listing.auctionEndsAt).getTime() <= Date.now();
  }, [listing?.auctionEndsAt]);

  const isActive = listing?.status === "auction";

  const quickBids = useMemo(() => {
    const base = highestBid > 0 ? highestBid : minNextBid;
    return [
      { label: `+$50`, amount: Math.ceil((base + 50) / 5) * 5 },
      { label: `+$100`, amount: Math.ceil((base + 100) / 5) * 5 },
      { label: `+$250`, amount: Math.ceil((base + 250) / 5) * 5 },
      { label: "Max Bid", amount: fullPrice },
    ];
  }, [highestBid, minNextBid, fullPrice]);

  const handleBid = async () => {
    setError("");
    const amount = parseFloat(bidAmount);

    if (!userId) {
      setError("You must be logged in to place a bid.");
      return;
    }
    if (!isActive) {
      setError("This auction is no longer active.");
      return;
    }
    if (isExpired) {
      setError("This auction has ended.");
      return;
    }
    if (!amount || amount < minNextBid) {
      setError(`Minimum bid is $${minNextBid.toLocaleString()}`);
      return;
    }
    if (autoBidEnabled && maxAutoBid && parseFloat(maxAutoBid) < amount) {
      setError("Max auto-bid must be greater than or equal to your bid.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you understand this is a booking interest bid.");
      return;
    }

    setLoading(true);
    try {
      const bid = await base44.entities.Bid.create({
        userId,
        listingId: listing.id,
        bidAmount: amount,
        autoBid: autoBidEnabled,
        maxAutoBid: autoBidEnabled ? parseFloat(maxAutoBid) || amount : 0,
        userName: (await base44.auth.me()).full_name || "",
      });

      // Admin notification
      try {
        await base44.entities.Notification.create({
          userId: "admin",
          role: "admin",
          type: "outbid",
          title: "New Auction Bid",
          message: `$${amount.toLocaleString()} bid on "${listing.title}"`,
          listingId: listing.id,
          isRead: false,
        });
      } catch (_) {}

      // User notification
      try {
        await base44.entities.Notification.create({
          userId,
          role: "user",
          type: "outbid",
          title: "Bid Placed",
          message: `You placed a $${amount.toLocaleString()} bid on "${listing.title}"${autoBidEnabled ? " with auto-bid enabled" : ""}.`,
          listingId: listing.id,
          isRead: false,
        });
      } catch (_) {}

      toast.success("Your bid has been submitted. Admin will review and contact you if shortlisted.");
      onSuccess?.();
      onClose();
      setBidAmount("");
      setAutoBidEnabled(false);
      setMaxAutoBid("");
      setConfirmed(false);
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border/40 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Gavel className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-sm">Place a Bid</h2>
                <p className="text-xs text-muted-foreground truncate">{listing.title}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-[10px] text-muted-foreground">Share Price</p>
                <p className="font-display font-bold text-sm">${sharePrice.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-[10px] text-muted-foreground">Full Ownership</p>
                <p className="font-display font-bold text-sm">${fullPrice.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                <p className="text-[10px] text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Highest Bid</p>
                <p className="font-display font-bold text-sm text-amber-400">${highestBid > 0 ? highestBid.toLocaleString() : "—"}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-[10px] text-muted-foreground">Minimum Next Bid</p>
                <p className="font-display font-bold text-sm">${minNextBid.toLocaleString()}</p>
              </div>
            </div>

            {/* Auction Countdown */}
            {listing.auctionEndsAt && (
              <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Auction Ends
                </div>
                <CountdownTimer endDate={listing.auctionEndsAt} />
              </div>
            )}

            {/* Total Bidders & User Rank */}
            <div className="flex items-center justify-between text-xs mb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{totalBidders} bidder{totalBidders !== 1 ? "s" : ""}</span>
              </div>
              {userRank && (
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                  Your Rank: #{userRank}
                </Badge>
              )}
              {estimatedSaving !== null && estimatedSaving > 0 && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Save up to ${estimatedSaving.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Bid History */}
            {bidHistory.length > 0 && (
              <div className="rounded-xl bg-secondary/30 p-3 mb-4">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                  <History className="w-3 h-3" /> Bid History
                </div>
                <div className="space-y-1.5">
                  {bidHistory.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        {b.userName || "User"}
                      </span>
                      <span className={`font-mono font-semibold ${i === 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                        ${b.bidAmount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bid Input */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Your Bid Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder={`Min $${minNextBid.toLocaleString()}`}
                    value={bidAmount}
                    onChange={(e) => { setBidAmount(e.target.value); setError(""); }}
                    className="pl-9 bg-secondary/60 border-border/40 rounded-xl h-10 text-sm"
                  />
                </div>
              </div>

              {/* Quick Bid Buttons */}
              <div className="flex gap-2 flex-wrap">
                {quickBids.map((qb) => (
                  <button
                    key={qb.label}
                    type="button"
                    onClick={() => { setBidAmount(qb.amount.toString()); setError(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 border border-border/30 text-muted-foreground hover:text-foreground hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    {qb.label} ${qb.amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Bid Toggle */}
            <div className="rounded-xl bg-secondary/30 p-3 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-medium">Auto Bid</span>
                </div>
                <Switch
                  checked={autoBidEnabled}
                  onCheckedChange={setAutoBidEnabled}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>
              <AnimatePresence>
                {autoBidEnabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 border-t border-border/30">
                      <label className="text-[10px] text-muted-foreground mb-1.5 block">
                        Max Auto-Bid Amount ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter max amount"
                        value={maxAutoBid}
                        onChange={(e) => setMaxAutoBid(e.target.value)}
                        className="bg-secondary/60 border-border/40 rounded-xl h-9 text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        System will auto-increase your bid up to this amount when someone outbids you.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 mb-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => { setConfirmed(e.target.checked); setError(""); }}
                className="mt-0.5 accent-amber-500 w-4 h-4 rounded"
              />
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed">
                I understand this is a booking interest bid, not a payment.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Expired / Inactive Warning */}
            {isExpired && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                This auction has ended. Bidding is closed.
              </div>
            )}
            {!isActive && !isExpired && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2.5 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                This auction is not currently active.
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleBid}
              disabled={loading || isExpired || !isActive}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl h-10 text-sm font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Bid...
                </div>
              ) : (
                <>
                  <Gavel className="w-4 h-4 mr-2" /> Confirm Bid
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}