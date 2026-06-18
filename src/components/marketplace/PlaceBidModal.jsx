import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, DollarSign, AlertCircle, Clock, Users, Zap, TrendingUp, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [bids, setBids] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!listing?.id || !open) return;
    base44.entities.Bid.filter({ listingId: listing.id }, "-created_date").then(setBids).catch(() => {});
    base44.auth.me().then((u) => {
      if (u) {
        setUserId(u.id);
        setUserName(u.full_name || "");
        setUserEmail(u.email || "");
      }
    }).catch(() => {});
  }, [listing?.id, open]);

  // Reset form fields when modal opens for a new listing
  useEffect(() => {
    if (open) {
      setBidAmount("");
      setMessage("");
      setConfirmed(false);
      setErrors({});
    }
  }, [open, listing?.id]);

  const sharePrice = Number(listing?.sharePrice) || 10;
  const totalShares = Number(listing?.totalShares) || 0;
  const fullPrice = sharePrice * totalShares;
  const MIN_INCREMENT = 50;
  const MAX_BID_MULTIPLIER = 10;
  const minBid = sharePrice * 0.5;

  const highestBid = useMemo(() => {
    if (!bids.length) return 0;
    const amounts = bids.map((b) => {
      const n = Number(b.bidAmount);
      return isNaN(n) || n < 0 || n > fullPrice * MAX_BID_MULTIPLIER ? 0 : n;
    });
    return Math.max(0, ...amounts);
  }, [bids, fullPrice]);

  const minNextBid = useMemo(() => {
    if (highestBid === 0) return minBid;
    return highestBid + MIN_INCREMENT;
  }, [highestBid, minBid]);

  const totalBidders = useMemo(() => {
    return new Set(bids.map((b) => b.userId)).size;
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
    return [...bids].sort((a, b) => b.bidAmount - a.bidAmount).slice(0, 3);
  }, [bids]);

  const isExpired = useMemo(() => {
    if (!listing?.auctionEndsAt) return false;
    return new Date(listing.auctionEndsAt).getTime() <= Date.now();
  }, [listing?.auctionEndsAt]);

  const isActive = listing?.status === "auction";

  const quickBids = useMemo(() => {
    const base = Number(highestBid > 0 ? highestBid : minNextBid);
    const safe = isNaN(base) || base < 0 ? minBid : base;
    const maxBid = fullPrice * MAX_BID_MULTIPLIER;
    return [
      { label: "+$50", amount: Math.min(Math.ceil((safe + 50) / 5) * 5, maxBid) },
      { label: "+$100", amount: Math.min(Math.ceil((safe + 100) / 5) * 5, maxBid) },
      { label: "+$250", amount: Math.min(Math.ceil((safe + 250) / 5) * 5, maxBid) },
      { label: "Max Bid", amount: fullPrice },
    ];
  }, [highestBid, minNextBid, minBid, fullPrice]);

  const validate = () => {
    const errs = {};
    if (!userId) errs.form = "You must be logged in to place a bid.";
    if (!isActive) errs.form = "This auction is no longer active.";
    if (isExpired) errs.form = "This auction has ended.";
    if (!userName.trim()) errs.userName = "Full name is required";
    if (!userEmail.trim()) errs.userEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) errs.userEmail = "Enter a valid email";
    if (!userPhone.trim()) errs.userPhone = "Phone number is required";
    const amount = parseFloat(bidAmount);
    const maxAllowed = fullPrice * MAX_BID_MULTIPLIER;
    if (!amount || isNaN(amount)) errs.bidAmount = "Bid amount is required";
    else if (amount < 0) errs.bidAmount = "Bid amount cannot be negative";
    else if (amount < minNextBid) errs.bidAmount = `Minimum bid is $${minNextBid.toLocaleString()}`;
    else if (amount > maxAllowed) errs.bidAmount = `Bid cannot exceed $${maxAllowed.toLocaleString()} (10x full price)`;
    if (!confirmed) errs.confirmed = "Please confirm this is a booking interest bid";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBid = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const amount = parseFloat(bidAmount);
      const bidReq = await base44.entities.BidRequests.create({
        userId,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        userPhone: userPhone.trim(),
        listingId: listing.id,
        listingTitle: listing.softwareName || listing.title || listing.name || "",
        bidAmount: amount,
        status: "pending",
        message: message.trim(),
      });

      // Admin notification
      try {
        const admins = await base44.entities.User.filter({ role: "admin" });
        for (const admin of admins) {
          await base44.entities.Notification.create({
            userId: admin.id,
            role: "admin",
            type: "listing_submitted",
            title: "New Bid Received",
            message: `${userName.trim()} bid $${amount.toLocaleString()} on "${listing.softwareName || listing.title || listing.name}"`,
            listingId: listing.id,
            relatedRequestId: bidReq.id,
            isRead: false,
          });
        }
      } catch (_) {}

      // User notification
      try {
        await base44.entities.Notification.create({
          userId,
          role: "user",
          type: "bid_submitted",
          title: "Bid Submitted",
          message: `Your bid of $${amount.toLocaleString()} on "${listing.softwareName || listing.title || listing.name}" has been submitted. Admin will review and contact you if shortlisted.`,
          listingId: listing.id,
          relatedRequestId: bidReq.id,
          isRead: false,
        });
      } catch (_) {}

      toast.success("Your bid has been submitted. Admin will review and contact you if shortlisted.");

      const listingName = listing.softwareName || listing.title || listing.name;
      // Admin email via centralized sender
      try {
        await base44.functions.invoke("sendEmail", {
          to: import.meta.env.VITE_ADMIN_EMAIL || "admin@saasshare.com",
          subject: `New Bid: $${amount.toLocaleString()} on ${listingName}`,
          body: `<p><strong>${userName.trim()}</strong> (${userEmail.trim()}) placed a bid of <strong>$${amount.toLocaleString()}</strong> on <strong>${listingName}</strong>.</p><p>Review in Admin Panel.</p>`,
          type: "bid_request_admin",
          relatedRequestId: bidReq?.id || "",
        });
      } catch (_) {}
      // Confirmation email to bidder
      try {
        await base44.functions.invoke("sendEmail", {
          to: userEmail.trim(),
          subject: `Bid Confirmed: $${amount.toLocaleString()} on ${listingName}`,
          body: `<p>Hi ${userName.trim()},</p><p>Your bid of <strong>$${amount.toLocaleString()}</strong> on <strong>${listingName}</strong> has been submitted. Our team will review and contact you if shortlisted.</p><p>— The SaaSShare Team</p>`,
          type: "bid_request_admin",
          relatedRequestId: bidReq?.id || "",
        });
      } catch (_) {}

      onSuccess?.();
      onClose();
      setBidAmount("");
      setMessage("");
      setConfirmed(false);
    } catch (e) {
      setErrors({ form: e?.message || "Something went wrong. Please try again." });
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
                <p className="text-xs text-muted-foreground truncate">{listing.softwareName || listing.title || listing.name}</p>
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
                <p className="text-[10px] text-muted-foreground">Minimum Bid</p>
                <p className="font-display font-bold text-sm">${minNextBid.toLocaleString()}</p>
              </div>
            </div>

            {/* Auction Countdown */}
            {listing.auctionEndsAt && (
              <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Auction Ends
                </div>
                <CountdownTimer endDate={listing.auctionEndsAt} />
              </div>
            )}

            {/* Bidders & Rank */}
            <div className="flex items-center justify-between text-xs mb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{totalBidders} bidder{totalBidders !== 1 ? "s" : ""}</span>
              </div>
              {userRank && (
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">Your Rank: #{userRank}</Badge>
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
                      <span className="text-muted-foreground truncate max-w-[60%]">{b.userName || "User"}</span>
                      <span className={`font-mono font-semibold ${i === 0 ? "text-amber-400" : "text-muted-foreground"}`}>${b.bidAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Fields */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name <span className="text-red-400">*</span></label>
                <Input
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => { setUserName(e.target.value); setErrors((p) => ({ ...p, userName: "" })); }}
                  className={`bg-secondary/60 border-border/40 rounded-xl h-9 text-sm ${errors.userName ? "border-red-500/50" : ""}`}
                />
                {errors.userName && <p className="text-xs text-red-400 mt-0.5">{errors.userName}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address <span className="text-red-400">*</span></label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={userEmail}
                  onChange={(e) => { setUserEmail(e.target.value); setErrors((p) => ({ ...p, userEmail: "" })); }}
                  className={`bg-secondary/60 border-border/40 rounded-xl h-9 text-sm ${errors.userEmail ? "border-red-500/50" : ""}`}
                />
                {errors.userEmail && <p className="text-xs text-red-400 mt-0.5">{errors.userEmail}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number <span className="text-red-400">*</span></label>
                <Input
                  placeholder="+1 234 567 8900"
                  value={userPhone}
                  onChange={(e) => { setUserPhone(e.target.value); setErrors((p) => ({ ...p, userPhone: "" })); }}
                  className={`bg-secondary/60 border-border/40 rounded-xl h-9 text-sm ${errors.userPhone ? "border-red-500/50" : ""}`}
                />
                {errors.userPhone && <p className="text-xs text-red-400 mt-0.5">{errors.userPhone}</p>}
              </div>
            </div>

            {/* Bid Amount */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Your Bid Amount ($) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={`Min $${minNextBid.toLocaleString()}`}
                    value={bidAmount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                        setBidAmount(raw);
                        setErrors((p) => ({ ...p, bidAmount: "" }));
                      }
                    }}
                    className={`pl-9 bg-secondary/60 border-border/40 rounded-xl h-10 text-sm ${errors.bidAmount ? "border-red-500/50" : ""}`}
                  />
                </div>
                {errors.bidAmount && <p className="text-xs text-red-400 mt-0.5">{errors.bidAmount}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickBids.map((qb) => (
                  <button
                    key={qb.label}
                    type="button"
                    onClick={() => { setBidAmount(qb.amount.toString()); setErrors((p) => ({ ...p, bidAmount: "" })); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 border border-border/30 text-muted-foreground hover:text-foreground hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    {qb.label} ${qb.amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1.5 block">Message (optional)</label>
              <Textarea
                placeholder="Any additional details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-secondary/60 border-border/40 rounded-xl h-16 resize-none text-sm"
              />
            </div>

            {/* Confirmation */}
            <label className="flex items-start gap-2.5 mb-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => { setConfirmed(e.target.checked); setErrors((p) => ({ ...p, confirmed: "" })); }}
                className="mt-0.5 accent-amber-500 w-4 h-4 rounded"
              />
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed">
                I understand this is a booking interest bid, not a payment.
              </span>
            </label>
            {errors.confirmed && <p className="text-xs text-red-400 -mt-3 mb-3">{errors.confirmed}</p>}

            {/* Error */}
            {errors.form && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.form}
              </div>
            )}

            {/* Expired Warning */}
            {isExpired && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> This auction has ended.
              </div>
            )}

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
                <><Gavel className="w-4 h-4 mr-2" /> Confirm Bid</>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}