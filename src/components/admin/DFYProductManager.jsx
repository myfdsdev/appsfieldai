import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Edit3, Trash2, Save, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const GRADIENTS = [
  "from-orange-500 to-amber-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
];

const emptyForm = {
  softwareName: "", logo: "", thumbnail: "", demoVideoUrl: "", shortDescription: "", fullDescription: "",
  category: "", featuresText: "", price: "", discountPrice: "", sharePrice: "",
  totalShares: "", monthlyRevenue: "", growthRate: "", rating: 5,
  dealType: "single_purchase", pricingType: "lifetime_deal",
  imageGradient: GRADIENTS[0], isActive: true,
  adminAccessType: "none", adminAccessUrl: "", adminAccessInfo: "",
};

export default function DFYProductManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["dfyProducts"],
    queryFn: () => base44.entities.DFYProduct.list("-created_date"),
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      softwareName: p.softwareName || "", logo: p.logo || "", thumbnail: p.thumbnail || "", demoVideoUrl: p.demoVideoUrl || "", shortDescription: p.shortDescription || "",
      fullDescription: p.fullDescription || "", category: p.category || "",
      featuresText: (p.features || []).join(", "), price: p.price ?? "", discountPrice: p.discountPrice ?? "",
      sharePrice: p.sharePrice ?? "", totalShares: p.totalShares ?? "", monthlyRevenue: p.monthlyRevenue ?? "",
      growthRate: p.growthRate ?? "", rating: p.rating ?? 5, dealType: p.dealType || "single_purchase",
      pricingType: p.pricingType || "lifetime_deal", imageGradient: p.imageGradient || GRADIENTS[0],
      isActive: p.isActive ?? true,
      adminAccessType: p.adminAccessType || "none", adminAccessUrl: p.adminAccessUrl || "", adminAccessInfo: p.adminAccessInfo || "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.softwareName.trim()) return toast.error("Product name is required");
    setSaving(true);
    const payload = {
      softwareName: form.softwareName, logo: form.logo, thumbnail: form.thumbnail, demoVideoUrl: form.demoVideoUrl, shortDescription: form.shortDescription,
      fullDescription: form.fullDescription, category: form.category,
      features: form.featuresText.split(",").map(f => f.trim()).filter(Boolean),
      price: parseFloat(form.price) || 0, discountPrice: parseFloat(form.discountPrice) || 0,
      sharePrice: parseFloat(form.sharePrice) || 0, totalShares: parseInt(form.totalShares) || 0,
      monthlyRevenue: parseFloat(form.monthlyRevenue) || 0, growthRate: parseFloat(form.growthRate) || 0,
      rating: parseFloat(form.rating) || 5, dealType: form.dealType, pricingType: form.pricingType,
      imageGradient: form.imageGradient, isActive: form.isActive,
      adminAccessType: form.adminAccessType,
      adminAccessUrl: form.adminAccessType === "url" ? form.adminAccessUrl : "",
      adminAccessInfo: form.adminAccessType === "info" ? form.adminAccessInfo : "",
    };
    if (editingId) await base44.entities.DFYProduct.update(editingId, payload);
    else await base44.entities.DFYProduct.create(payload);
    queryClient.invalidateQueries({ queryKey: ["dfyProducts"] });
    setSaving(false);
    setShowForm(false);
    toast.success(editingId ? "DFY product updated" : "DFY product added");
  };

  const handleDelete = async (p) => {
    await base44.entities.DFYProduct.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ["dfyProducts"] });
    toast.success("DFY product deleted");
  };

  const toggleActive = async (p) => {
    await base44.entities.DFYProduct.update(p.id, { isActive: !p.isActive });
    queryClient.invalidateQueries({ queryKey: ["dfyProducts"] });
  };

  if (showForm) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Package className="w-4 h-4 text-orange-400" />{editingId ? "Edit" : "Add"} DFY Product</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-8 text-xs"><X className="w-3.5 h-3.5" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Product Name *</label><Input value={form.softwareName} onChange={e => setForm(f => ({ ...f, softwareName: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Category</label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="CRM, AI & ML..." /></div>
              <div><label className="text-xs text-muted-foreground">Logo URL</label><Input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="https://..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Thumbnail URL</label><Input value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="https://... cover image" /></div>
              <div><label className="text-xs text-muted-foreground">Demo Video URL</label><Input value={form.demoVideoUrl} onChange={e => setForm(f => ({ ...f, demoVideoUrl: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="https://...mp4 or YouTube" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Short Description</label><Input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Full Description</label><Textarea value={form.fullDescription} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1 h-20 resize-none" /></div>
            <div><label className="text-xs text-muted-foreground">Features (comma-separated)</label><Input value={form.featuresText} onChange={e => setForm(f => ({ ...f, featuresText: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="Feature A, Feature B" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Price ($)</label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Deal Price ($)</label><Input type="number" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Share Price ($)</label><Input type="number" value={form.sharePrice} onChange={e => setForm(f => ({ ...f, sharePrice: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Total Shares</label><Input type="number" value={form.totalShares} onChange={e => setForm(f => ({ ...f, totalShares: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Monthly Rev ($)</label><Input type="number" value={form.monthlyRevenue} onChange={e => setForm(f => ({ ...f, monthlyRevenue: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Growth (%)</label><Input type="number" value={form.growthRate} onChange={e => setForm(f => ({ ...f, growthRate: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Deal Type</label>
                <select value={form.dealType} onChange={e => setForm(f => ({ ...f, dealType: e.target.value }))} className="w-full bg-[#252525] border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="single_purchase">Single Buy</option>
                  <option value="group_deal">Group Deal</option>
                  <option value="both">Group + Single</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Card Gradient</label>
                <select value={form.imageGradient} onChange={e => setForm(f => ({ ...f, imageGradient: e.target.value }))} className="w-full bg-[#252525] border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  {GRADIENTS.map(g => <option key={g} value={g}>{g.replace("from-", "").replace(" to-", " → ")}</option>)}
                </select>
              </div>
            </div>
            {/* Admin access — delivered to store owners so they can manage user access */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Get Admin Access delivery</p>
                <p className="text-[10px] text-muted-foreground">Store owners who import this product get a "Get Admin Access" button. Choose how it's delivered.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Access type</label>
                <select value={form.adminAccessType} onChange={e => setForm(f => ({ ...f, adminAccessType: e.target.value }))} className="w-full bg-[#252525] border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="none">None (hide button)</option>
                  <option value="url">Link — opens in a new tab</option>
                  <option value="info">Info — revealed on the owner's side</option>
                </select>
              </div>
              {form.adminAccessType === "url" && (
                <div><label className="text-xs text-muted-foreground">Admin Access URL</label><Input value={form.adminAccessUrl} onChange={e => setForm(f => ({ ...f, adminAccessUrl: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="https://admin.yoursoftware.com/login" /></div>
              )}
              {form.adminAccessType === "info" && (
                <div><label className="text-xs text-muted-foreground">Admin Access Info</label><Textarea value={form.adminAccessInfo} onChange={e => setForm(f => ({ ...f, adminAccessInfo: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1 h-24 resize-none" placeholder="Admin panel: https://...&#10;Username: ...&#10;Password: ...&#10;Notes on managing user access" /></div>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
              <Save className="w-4 h-4" /> {editingId ? "Update" : "Add"} Product
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Package className="w-4 h-4 text-orange-400" />DFY Products
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] ml-2">{presets.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-xs h-8 text-white border-0"><Plus className="w-3 h-3 mr-1" />Add Product</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground -mt-1 mb-2">These "done-for-you" products can be imported by store owners into their stores as starter products.</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : presets.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 mx-auto mb-2 text-orange-400/40" />
              <p className="text-sm text-muted-foreground">No DFY products yet. Add presets store owners can import.</p>
            </div>
          ) : presets.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.imageGradient || GRADIENTS[0]} flex items-center justify-center shrink-0`}>
                  <span className="text-white font-bold text-xs">{(p.softwareName || "?")[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{p.softwareName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.category} {p.discountPrice > 0 && `· $${p.discountPrice}`}{p.sharePrice > 0 && ` · $${p.sharePrice}/spot`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${p.isActive ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 text-[10px]"><Edit3 className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(p)} className="h-7 text-[10px] text-red-400"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}