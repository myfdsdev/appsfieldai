import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Ticket, Check, Plus, Pencil, Trash2, Infinity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { toast } from "sonner";

const FEATURE_TOGGLES = [
  { key: "premiumTemplatesAccess", label: "Premium Templates Access", desc: "Allows access to premium templates" },
  { key: "customDomainAllowed", label: "Custom Domain", desc: "Users can connect their own domain" },
  { key: "multiVendorAllowed", label: "Multi-Vendor", desc: "Users can enable multi-vendor mode" },
  { key: "whiteLabelAllowed", label: "White-Label", desc: "Remove platform branding" },
  { key: "commissionModuleAllowed", label: "Commission Module", desc: "Users can set commission rates" },
  { key: "featuredListingsAllowed", label: "Featured Listings", desc: "Users can feature listings" },
  { key: "liveAuctionsAllowed", label: "Live Auctions", desc: "Access to the Live Auctions section" },
  { key: "vendorManagementAllowed", label: "Vendor Management", desc: "Access to vendor management" },
  { key: "myRequestsAllowed", label: "My Requests", desc: "Access to the My Requests section" },
  { key: "investmentsAllowed", label: "Investments", desc: "Access to the Investments section" },
];

const SwitchRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5">
    <div className="pr-4">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
    </div>
    <Switch checked={!!checked} onCheckedChange={onChange} />
  </div>
);

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
    setForm({ name: "", description: "", conditionBoxDescription: "", monthlyPrice: 0, yearlyPrice: 0, durationType: "monthly", sortOrder: 0, storeLimit: 1, productLimit: 10, premiumTemplatesAccess: false, customDomainAllowed: false, multiVendorAllowed: false, whiteLabelAllowed: false, commissionModuleAllowed: false, featuredListingsAllowed: false, liveAuctionsAllowed: false, vendorManagementAllowed: false, myRequestsAllowed: false, investmentsAllowed: false, jvzooProductId: "", purchaseUrl: "", thumbnailUrl: "", isActive: true, visibleToUsers: true });
  };

  const openCreate = () => { resetForm(); setEditPlan(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditPlan(p); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Plan name is required"); return; }
    const data = { ...form, monthlyPrice: parseFloat(form.monthlyPrice) || 0, yearlyPrice: parseFloat(form.yearlyPrice) || 0, sortOrder: parseInt(form.sortOrder) || 0, storeLimit: parseInt(form.storeLimit) || 0, productLimit: parseInt(form.productLimit) || 0 };
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
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Stores</span><span className="font-medium">{p.storeLimit ?? 0}</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Products/store</span><span className="font-medium">{p.productLimit ?? 0}</span></div>
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
        <DialogContent className="bg-card border-border/40 max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-xl">{editPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle></DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-display font-bold mb-3">Basic Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium">Plan Name <span className="text-red-400">*</span></label><Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Pro Plan" className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-medium">Price (USD) <span className="text-red-400">*</span></label><Input type="number" value={form.monthlyPrice ?? 0} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-medium">Yearly Price (USD)</label><Input type="number" value={form.yearlyPrice ?? 0} onChange={(e) => setForm((f) => ({ ...f, yearlyPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-medium">Display Order</label><Input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Lower numbers appear first</p></div>
              </div>
              <div className="mt-4 max-w-xs">
                <label className="text-xs font-medium">Duration Type</label>
                <select value={form.durationType || "monthly"} onChange={(e) => setForm((f) => ({ ...f, durationType: e.target.value }))} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option><option value="one_time">One-Time</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium">Condition Box Description</label>
                <Textarea value={form.conditionBoxDescription || ""} onChange={(e) => setForm((f) => ({ ...f, conditionBoxDescription: e.target.value }))} placeholder="Optional: Add conditions or special notes for this plan" className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-20 resize-none" />
              </div>
            </div>

            {/* Limits */}
            <div className="border-t border-border/30 pt-4">
              <h3 className="text-sm font-display font-bold mb-3">Limits</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium">Store Creation Limit <span className="text-red-400">*</span></label><Input type="number" value={form.storeLimit ?? 0} onChange={(e) => setForm((f) => ({ ...f, storeLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Max stores the user can create</p></div>
                <div><label className="text-xs font-medium">Product Limit (per store) <span className="text-red-400">*</span></label><Input type="number" value={form.productLimit ?? 0} onChange={(e) => setForm((f) => ({ ...f, productLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Max products per store</p></div>
              </div>
            </div>

            {/* Enabled Features */}
            <div className="border-t border-border/30 pt-4">
              <h3 className="text-sm font-display font-bold mb-1">Enabled Features</h3>
              <div className="rounded-xl border border-border/30 bg-secondary/20 px-4 py-1 divide-y divide-border/20">
                <SwitchRow label="Plan is Active" desc="Users can be assigned to this plan" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <SwitchRow label="Visible to Users" desc="Show this plan to regular users (admins always see it)" checked={form.visibleToUsers} onChange={(v) => setForm((f) => ({ ...f, visibleToUsers: v }))} />
                {FEATURE_TOGGLES.map(({ key, label, desc }) => (
                  <SwitchRow key={key} label={label} desc={desc} checked={form[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
                ))}
              </div>
            </div>

            {/* Admin Only Fields */}
            <div className="border-t border-border/30 pt-4">
              <h3 className="text-sm font-display font-bold">Admin Only Fields</h3>
              <p className="text-[11px] text-muted-foreground mb-3">These fields are not shown to regular users</p>
              <div className="space-y-4">
                <div><label className="text-xs font-medium">JVZoo Product ID</label><Input value={form.jvzooProductId || ""} onChange={(e) => setForm((f) => ({ ...f, jvzooProductId: e.target.value }))} placeholder="Optional: JVZoo product ID (for IPN integration)" className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-medium">Purchase URL</label><Input value={form.purchaseUrl || ""} onChange={(e) => setForm((f) => ({ ...f, purchaseUrl: e.target.value }))} placeholder="Optional: External purchase link" className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              </div>
            </div>

            {/* Plan Thumbnail */}
            <div className="border-t border-border/30 pt-4">
              <h3 className="text-sm font-display font-bold mb-3">Plan Thumbnail</h3>
              <label className="text-xs font-medium">Thumbnail Image</label>
              <div className="mt-1"><R2ImageUpload value={form.thumbnailUrl} onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} campaignId="plan-thumbnail" placeholder="https://..." /></div>
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