import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Ticket, Check, Plus, Pencil, Trash2, Infinity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PlanManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({});

  const { data: plans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });

  const resetForm = () => {
    setForm({ name: "", description: "", monthlyPrice: 0, yearlyPrice: 0, marketplaceLimit: 1, vendorLimit: 0, productLimit: 10, customerLimit: 100, orderLimit: 50, storageLimit: 500, customDomainAllowed: false, multiVendorAllowed: false, whiteLabelAllowed: false, commissionModuleAllowed: false, featuredListingsAllowed: false, supportLevel: "basic", isActive: true, sortOrder: 0 });
  };

  const openCreate = () => { resetForm(); setEditPlan(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditPlan(p); setShowForm(true); };

  const handleSave = async () => {
    const data = { ...form, monthlyPrice: parseFloat(form.monthlyPrice) || 0, yearlyPrice: parseFloat(form.yearlyPrice) || 0, marketplaceLimit: parseInt(form.marketplaceLimit) || 0, vendorLimit: parseInt(form.vendorLimit) || 0, productLimit: parseInt(form.productLimit) || 0, customerLimit: parseInt(form.customerLimit) || 0, orderLimit: parseInt(form.orderLimit) || 0, storageLimit: parseInt(form.storageLimit) || 0 };
    if (editPlan) {
      await base44.entities.SubscriptionPlan.update(editPlan.id, data);
      toast.success(`Plan "${data.name}" updated`);
    } else {
      await base44.entities.SubscriptionPlan.create(data);
      toast.success(`Plan "${data.name}" created`);
    }
    queryClient.invalidateQueries({ queryKey: ["platformPlans"] });
    setShowForm(false);
  };

  const handleDelete = async (p) => {
    await base44.entities.SubscriptionPlan.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ["platformPlans"] });
    toast.success(`Plan "${p.name}" deleted`);
  };

  const toggleActive = async (p) => {
    await base44.entities.SubscriptionPlan.update(p.id, { isActive: !p.isActive });
    queryClient.invalidateQueries({ queryKey: ["platformPlans"] });
    toast.success(`Plan "${p.name}" ${p.isActive ? "deactivated" : "activated"}`);
  };

  const toggleField = (field) => setForm((f) => ({ ...f, [field]: !f[field] }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Subscription Plans</h2>
            <p className="text-sm text-muted-foreground">Manage platform plans for marketplace owners.</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Create Plan</Button>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden ${!p.isActive && "opacity-50"}`}>
              {!p.isActive && <div className="absolute top-3 right-3"><Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Inactive</Badge></div>}
              <CardContent className="p-5">
                <p className="font-display font-bold text-sm">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description || "—"}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Monthly</span><span className="font-bold text-amber-400">${p.monthlyPrice}/mo</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Yearly</span><span className="font-bold text-amber-400">${p.yearlyPrice}/yr</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Marketplaces</span><span className="font-medium">{p.marketplaceLimit || <Infinity className="w-3 h-3 inline" />}</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Vendors</span><span className="font-medium">{p.vendorLimit || <Infinity className="w-3 h-3 inline" />}</span></div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.customDomainAllowed && <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Domain</Badge>}
                  {p.multiVendorAllowed && <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">Multi-Vendor</Badge>}
                  {p.whiteLabelAllowed && <Badge className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/20">White-Label</Badge>}
                  {p.commissionModuleAllowed && <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Commission</Badge>}
                </div>
                <div className="flex gap-1 mt-4">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 text-[10px]"><Pencil className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(p)} className="h-7 text-[10px]">{p.isActive ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)} className="text-red-400/60 hover:text-red-400 h-7 text-[10px]"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border/40 max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">{editPlan ? "Edit Plan" : "Create Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Plan Name</label><Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Description</label><Input value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Monthly Price ($)</label><Input type="number" value={form.monthlyPrice || 0} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Yearly Price ($)</label><Input type="number" value={form.yearlyPrice || 0} onChange={(e) => setForm((f) => ({ ...f, yearlyPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Marketplace Limit</label><Input type="number" value={form.marketplaceLimit || 0} onChange={(e) => setForm((f) => ({ ...f, marketplaceLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Vendor Limit</label><Input type="number" value={form.vendorLimit || 0} onChange={(e) => setForm((f) => ({ ...f, vendorLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Product Limit</label><Input type="number" value={form.productLimit || 0} onChange={(e) => setForm((f) => ({ ...f, productLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Customer Limit</label><Input type="number" value={form.customerLimit || 0} onChange={(e) => setForm((f) => ({ ...f, customerLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Order Limit</label><Input type="number" value={form.orderLimit || 0} onChange={(e) => setForm((f) => ({ ...f, orderLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Storage (MB)</label><Input type="number" value={form.storageLimit || 0} onChange={(e) => setForm((f) => ({ ...f, storageLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Support Level</label>
              <select value={form.supportLevel || "basic"} onChange={(e) => setForm((f) => ({ ...f, supportLevel: e.target.value }))} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                <option value="basic">Basic</option><option value="priority">Priority</option><option value="dedicated">Dedicated</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {[{ key: "customDomainAllowed", label: "Custom Domain" }, { key: "multiVendorAllowed", label: "Multi-Vendor" }, { key: "whiteLabelAllowed", label: "White-Label" }, { key: "commissionModuleAllowed", label: "Commission Module" }, { key: "featuredListingsAllowed", label: "Featured Listings" }].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={!!form[key]} onChange={() => toggleField(key)} className="w-4 h-4 rounded accent-amber-500" /> {label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl">{editPlan ? "Save Changes" : "Create Plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}