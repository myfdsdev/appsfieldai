import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { CalendarCheck, Loader2 } from "lucide-react";

export default function ReserveSpotModal({ listing, open, onClose }) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setPhone("");
      setBudget("");
      setMessage("");
      setErrors({});
      base44.auth.me().then((u) => {
        if (u) {
          setUserName(u.full_name || "");
          setUserEmail(u.email || "");
        }
      }).catch(() => {});
    }
  }, [open]);

  const validate = () => {
    const errs = {};
    if (!userName.trim()) errs.userName = "Full name is required";
    if (!userEmail.trim()) {
      errs.userEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      errs.userEmail = "Enter a valid email address";
    }
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!budget.trim() || isNaN(parseFloat(budget))) errs.budget = "Budget is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReserve = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const reservation = await base44.entities.DealReservations.create({
        userId: user.id,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        listingId: listing.id,
        listingTitle: listing.softwareName || listing.title || listing.name || "",
        phone: phone.trim(),
        budget: parseFloat(budget) || 0,
        message: message.trim(),
        requestType: "reserve_spot",
        status: "pending",
      });
      try { await base44.functions.invoke("notifyAdminReservation", { userName: userName.trim(), userEmail: userEmail.trim(), listingTitle: listing.softwareName || listing.title || listing.name || "", listingId: listing.id, requestId: reservation.id, phone: phone.trim(), budget: parseFloat(budget) || 0, message: message.trim() }); } catch (_) {}
      try {
        await base44.entities.Notification.create({
          userId: user.id, role: "user", type: "reserve_submitted",
          title: "Reservation Submitted",
          message: `Your spot reservation for "${listing.softwareName || listing.title || listing.name}" has been submitted. The admin will review it soon.`,
          listingId: listing.id, relatedRequestId: reservation.id, isRead: false,
        });
      } catch (_) {}
      toast.success("Spot reserved! The admin will contact you soon.");
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
            <CalendarCheck className="w-5 h-5 text-orange-400" />
            Reserve a Spot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
            <p className="text-sm font-medium">{listing.softwareName || listing.title || listing.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{listing.category}</span>
              <span>${listing.sharePrice}/share</span>
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
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.phone ? "border-red-500/50" : ""}`}
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Budget ($) <span className="text-red-400">*</span></label>
            <Input
              type="number"
              placeholder="Enter your budget"
              value={budget}
              onChange={(e) => { setBudget(e.target.value); setErrors((prev) => ({ ...prev, budget: "" })); }}
              className={`bg-secondary/50 border-border/30 rounded-xl ${errors.budget ? "border-red-500/50" : ""}`}
            />
            {errors.budget && <p className="text-xs text-red-400 mt-1">{errors.budget}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
            <Textarea
              placeholder="Any specific number of shares or questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-secondary/50 border-border/30 rounded-xl h-20 resize-none"
            />
          </div>

          {errors.form && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 text-center">
              {errors.form}
            </motion.p>
          )}

          <Button onClick={handleReserve} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl h-10 text-white border-0">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarCheck className="w-4 h-4 mr-2" />}
            Confirm Reservation
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}