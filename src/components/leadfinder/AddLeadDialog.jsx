import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

// Manually add a lead directly to the shortlist.
export default function AddLeadDialog({ open, onClose, ownerId }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ businessName: "", description: "", email: "", phone: "", website: "", instagram: "", facebook: "" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.businessName.trim()) { toast.error("Business name is required"); return; }
    setSaving(true);
    try {
      await base44.entities.FoundLead.create({
        ownerId,
        businessName: form.businessName.trim(),
        description: form.description.trim(),
        emails: form.email.trim() ? [form.email.trim()] : [],
        phone: form.phone.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        shortlisted: true,
        contactStatus: "new",
      });
      queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
      toast.success("Lead added to shortlist");
      setForm({ businessName: "", description: "", email: "", phone: "", website: "", instagram: "", facebook: "" });
      onClose();
    } catch (e) {
      toast.error(e.message || "Could not add lead");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add a lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Business name *</Label><Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} className="mt-1" placeholder="Acme Fitness" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1" rows={2} placeholder="Short note about this business" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1" placeholder="name@business.com" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" placeholder="+1 555 000 0000" /></div>
          </div>
          <div><Label className="text-xs">Website</Label><Input value={form.website} onChange={(e) => set("website", e.target.value)} className="mt-1" placeholder="https://" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Instagram</Label><Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} className="mt-1" placeholder="https://instagram.com/" /></div>
            <div><Label className="text-xs">Facebook</Label><Input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} className="mt-1" placeholder="https://facebook.com/" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}