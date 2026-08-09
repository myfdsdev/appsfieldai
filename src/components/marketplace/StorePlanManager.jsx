import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, CreditCard, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PlanProductPicker from "@/components/marketplace/PlanProductPicker";

const BILLING = [
  { id: "one_time", label: "One-time payment" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const blank = (marketplaceId) => ({
  marketplaceId,
  name: "",
  description: "",
  billingType: "monthly",
  price: 0,
  productLimit: 0,
  includedListingIds: [],
  features: [],
  accessUrl: "",
  accessInstructions: "",
  highlighted: false,
  sortOrder: 0,
  isActive: true,
});

export default function StorePlanManager({ marketplaceId, currency = "USD" }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: plans = [], isFetching } = useQuery({
    queryKey: ["storePlans", marketplaceId],
    queryFn: async () => {
      const rows = await base44.entities.StorePlan.filter({ marketplaceId });
      return [...rows].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },
    enabled: !!marketplaceId,
    refetchOnMount: "always",
    staleTime: 0,
    retry: 2,
  });
  const isLoading = !marketplaceId || (isFetching && plans.length === 0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["storePlans", marketplaceId] });

  const save = async () => {
    if (!form.name.trim()) { toast.error("Give the plan a name."); return; }
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0, productLimit: Number(form.productLimit) || 0, sortOrder: Number(form.sortOrder) || 0 };
    if (form.id) await base44.entities.StorePlan.update(form.id, payload);
    else await base44.entities.StorePlan.create(payload);
    refresh();
    setForm(null);
    setSaving(false);
    toast.success("Plan saved.");
  };

  const remove = async (plan) => {
    await base44.entities.StorePlan.delete(plan.id);
    refresh();
    toast.success("Plan deleted.");
  };

  if (form) {
    return (
      <div className="bg-card/60 border border-border/40 rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold">{form.id ? "Edit Plan" : "New Plan"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Plan Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Pro" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Billing</label>
            <select value={form.billingType} onChange={e => setForm(f => ({ ...f, billingType: e.target.value }))} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
              {BILLING.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Price ({currency})</label>
            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Product Limit (-1 = unlimited)</label>
            <Input type="number" value={form.productLimit} onChange={e => setForm(f => ({ ...f, productLimit: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Short Description</label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Everything a growing team needs" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">What's included (one per line)</label>
            <Textarea value={(form.features || []).join("\n")} onChange={e => setForm(f => ({ ...f, features: e.target.value.split("\n").filter(Boolean) }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-24 resize-none" placeholder={"Access to all products\nPriority support"} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Products included in this plan (leave empty to include all store products, up to the limit)</label>
            <div className="mt-1">
              <PlanProductPicker
                marketplaceId={marketplaceId}
                value={form.includedListingIds || []}
                onChange={(ids) => setForm(f => ({ ...f, includedListingIds: ids }))}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Access URL delivered after payment (optional)</label>
            <Input value={form.accessUrl} onChange={e => setForm(f => ({ ...f, accessUrl: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="https://app.yourproduct.com" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Access instructions delivered after payment (optional)</label>
            <Textarea value={form.accessInstructions} onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-20 resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sort Order</label>
            <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.highlighted} onChange={e => setForm(f => ({ ...f, highlighted: e.target.checked }))} className="accent-orange-500 w-4 h-4" /> Most popular</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-orange-500 w-4 h-4" /> Active</label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Plan
          </Button>
          <Button onClick={() => setForm(null)} variant="outline" className="border-border/40 rounded-xl">Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setForm(blank(marketplaceId))} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5">
        <Plus className="w-4 h-4" /> New Plan
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-muted-foreground">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No subscription plans yet. Create one to start selling recurring access.</p>
        </div>
      ) : plans.map(p => (
        <div key={p.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/60">
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-2">
              {p.name}
              {p.highlighted && <Star className="w-3.5 h-3.5 text-amber-400" />}
              {p.isActive === false && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {currency} {p.price} · {BILLING.find(b => b.id === p.billingType)?.label || "Monthly"} · {p.productLimit === -1 ? "Unlimited" : p.productLimit} products
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setForm({ ...blank(marketplaceId), ...p })} size="sm" variant="outline" className="border-border/40 rounded-lg"><Pencil className="w-3.5 h-3.5" /></Button>
            <Button onClick={() => remove(p)} size="sm" variant="outline" className="border-red-500/30 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}