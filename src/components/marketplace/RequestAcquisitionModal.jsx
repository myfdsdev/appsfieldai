import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Building2, Loader2 } from "lucide-react";

export default function RequestAcquisitionModal({ listing, open, onClose }) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setOfferAmount(listing?.fullPrice?.toString() || "");
      base44.auth.me().then((u) => {
        if (u) {
          setUserName(u.full_name || "");
          setUserEmail(u.email || "");
        }
      }).catch(() => {});
    }
  }, [open, listing]);

  const validate = () => {
    const errs = {};
    if (!userName.trim()) errs.userName = "Full name is required";
    if (!userEmail.trim()) {
      errs.userEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      errs.userEmail = "Enter a valid email address";
    }
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!offerAmount.trim() || isNaN(parseFloat(offerAmount))) errs.offerAmount = "Offer amount is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequest = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const offer = parseFloat(offerAmount) || listing.fullPrice || 0;
      const request = await base44.entities.AcquisitionRequests.create({
        userId: user.id,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        listingId: listing.id,
        listingTitle: listing.title,
        phone: phone.trim(),
        offerAmount: offer,
        notes: notes.trim(),
        requestType: "acquisition_request",
        status: "pending",
      });
      try { await base44.functions.invoke("notifyAdminAcquisitionRequest", { userName: userName.trim(), userEmail: userEmail.trim(), listingTitle: listing.title, listingId: listing.id, requestId: request.id, phone: phone.trim(), offerAmount: offer }); } catch (_) {}
      try {
        await base44.entities.Notification.create({
          userId: user.id, role: "user", type: "acquisition_submitted",
          title: "Acquisition Request Submitted",
          message: `Your acquisition request for "${listing.title}" has been submitted. The admin will review it soon.`,
          listingId: listing.id, relatedRequestId: request.id, isRead: false,
        });
      } catch (_) {}
      toast.success("Acquisition request submitted! The admin will review and contact you.");
      onClose();
    } catch (e) {
      setErrors({ form: e?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            Request Acquisition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
            <p className="text-sm font-medium">{listing.title}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{listing.category}</span>
              <span>Full price: ${listing.fullPrice?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name <span className="text-red-400">*</span></label>
            <Input
              placeholder="John Doe"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setErrors((prev) => ({ ...prev, userName: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.userName ? "border-red-500/50" : ""}`}
            />
            {errors.userName && <p className="text-xs text-red-400 mt-1">{errors.userName}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email Address <span className="text-red-400">*</span></label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={userEmail}
              onChange={(e) => { setUserEmail(e.target.value); setErrors((prev) => ({ ...prev, userEmail: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.userEmail ? "border-red-500/50" : ""}`}
            />
            {errors.userEmail && <p className="text-xs text-red-400 mt-1">{errors.userEmail}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone Number <span className="text-red-400">*</span></label>
            <Input
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.phone ? "border-red-500/50" : ""}`}
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Your Offer ($) <span className="text-red-400">*</span></label>
            <Input
              type="number"
              value={offerAmount}
              onChange={(e) => { setOfferAmount(e.target.value); setErrors((prev) => ({ ...prev, offerAmount: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.offerAmount ? "border-red-500/50" : ""}`}
              placeholder="Enter offer amount"
            />
            {errors.offerAmount && <p className="text-xs text-red-400 mt-1">{errors.offerAmount}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
            <Textarea
              placeholder="Any questions or details about your acquisition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 border-border/30 rounded-xl h-20 resize-none"
            />
          </div>

          {errors.form && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 text-center">
              {errors.form}
            </motion.p>
          )}

          <Button onClick={handleRequest} disabled={loading} className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl h-10 text-white border-0">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
            Submit Request
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}