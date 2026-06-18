import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DemoRequestModal({ listing, open, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (currentUser && open) {
      setForm((f) => ({
        ...f,
        name: f.name || currentUser.full_name || "",
        email: f.email || currentUser.email || "",
      }));
    }
  }, [currentUser, open]);

  // Reset form when modal opens with a different listing
  useEffect(() => {
    if (open) {
      setForm({
        name: currentUser?.full_name || "",
        email: currentUser?.email || "",
        phone: "",
        message: "",
      });
      setSubmitted(false);
    }
  }, [open, listing?.id]);

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email are required."); return; }
    if (!form.phone.trim()) { toast.error("Phone number is required."); return; }
    if (!listing?.id) { toast.error("Invalid listing. Please try again."); return; }
    setLoading(true);
    try {
      await base44.entities.DemoRequests.create({
        userId: currentUser?.id || "",
        userName: form.name,
        userEmail: form.email,
        phone: form.phone,
        message: form.message,
        listingId: listing.id,
        listingTitle: listing.softwareName || listing.title || "Untitled",
        status: "pending",
      });
      // Admin notification via centralized sender (logged automatically)
      try {
        await base44.functions.invoke("sendEmail", {
          to: import.meta.env.VITE_ADMIN_EMAIL || "admin@saasshare.com",
          subject: `New Demo Request: ${listing.softwareName || listing.title}`,
          body: `<p><strong>${form.name}</strong> (${form.email}) has requested a demo for <strong>${listing.softwareName || listing.title}</strong>.</p><p>Phone: ${form.phone}</p>${form.message ? `<p>Message: ${form.message}</p>` : ""}<p>Review in the Admin Panel.</p>`,
          type: "demo_request_admin",
        });
      } catch (_) {}
      setSubmitted(true);
      toast.success("Demo request submitted successfully.");
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      toast.error(err?.message || "Failed to submit demo request. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form, listing, currentUser, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-card border border-border/40 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        {submitted ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-display font-bold">Request Submitted!</h3>
            <p className="text-sm text-muted-foreground mt-2">The vendor will contact you to schedule a demo.</p>
            <Button onClick={onClose} className="mt-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">Close</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-display font-bold">Request a Demo</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{listing?.softwareName || listing?.title || "Software Demo Request"}</p>
            <div className="space-y-3">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name *" className="bg-secondary/50 border-border/30 rounded-xl h-9 text-sm" />
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email *" type="email" className="bg-secondary/50 border-border/30 rounded-xl h-9 text-sm" />
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="bg-secondary/50 border-border/30 rounded-xl h-9 text-sm" />
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What would you like to know? (optional)" className="bg-secondary/50 border-border/30 rounded-xl h-20 text-sm" />
              <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl h-10">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Submit Request
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}