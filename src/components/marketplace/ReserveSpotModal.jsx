import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { CalendarCheck, Loader2 } from "lucide-react";

export default function ReserveSpotModal({ listing, open, onClose }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReserve = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await base44.auth.me();
      await base44.entities.DealReservations.create({
        userId: user.id,
        userName: user.full_name || "",
        userEmail: user.email || "",
        listingId: listing.id,
        listingTitle: listing.title,
        notes,
        status: "pending",
      });
      try { await base44.functions.invoke("notifyAdminReservation", { userName: user.full_name, userEmail: user.email, listingTitle: listing.title }); } catch (_) {}
      toast.success("Spot reserved! The admin will contact you soon.");
      onClose();
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-violet-400" />
            Reserve a Spot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
            <p className="text-sm font-medium">{listing.title}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{listing.category}</span>
              <span>${listing.sharePrice}/share</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <Textarea
              placeholder="Any specific number of shares or questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 border-border/30 rounded-xl h-24 resize-none"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 text-center">
              {error}
            </motion.p>
          )}

          <Button onClick={handleReserve} disabled={loading} className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl h-10 text-white border-0">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarCheck className="w-4 h-4 mr-2" />}
            Confirm Reservation
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}