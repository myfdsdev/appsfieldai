import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, CreditCard, Banknote, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// Store payment settings — PayPal (sandbox/live with Client ID & Secret) + Cash on Delivery.
export default function PaymentSettingsManager({ marketplace }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    paypalEnabled: marketplace?.payment?.paypalEnabled ?? false,
    paypalMode: marketplace?.payment?.paypalMode || "sandbox",
    paypalClientId: marketplace?.payment?.paypalClientId || "",
    paypalSecret: marketplace?.payment?.paypalSecret || "",
    paypalEmail: marketplace?.payment?.paypalEmail || "",
    codEnabled: marketplace?.payment?.codEnabled ?? false,
    codInstructions: marketplace?.payment?.codInstructions || "",
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Marketplace.update(marketplace.id, { payment: form });
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    toast.success("Payment settings saved!");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* PayPal */}
      <div className={`rounded-2xl border transition-all ${form.paypalEnabled ? "border-orange-500/20 bg-orange-500/5" : "border-border/30 bg-card/60"}`}>
        <label className="flex items-center justify-between p-5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center"><CreditCard className="w-4.5 h-4.5 text-orange-400" /></div>
            <div><p className="text-sm font-semibold">PayPal</p><p className="text-[11px] text-muted-foreground">Accept card & PayPal payments via the PayPal REST API</p></div>
          </div>
          <input type="checkbox" checked={form.paypalEnabled} onChange={e => set("paypalEnabled", e.target.checked)} className="accent-orange-500 w-4 h-4" />
        </label>

        {form.paypalEnabled && (
          <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
            {/* Environment switch */}
            <div>
              <label className="text-xs text-muted-foreground">Environment</label>
              <div className="flex gap-2 mt-1.5">
                {[{ id: "sandbox", label: "Sandbox", desc: "Testing" }, { id: "live", label: "Live", desc: "Real payments" }].map(opt => (
                  <button key={opt.id} onClick={() => set("paypalMode", opt.id)}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-left transition-all ${form.paypalMode === opt.id ? "border-orange-500 bg-orange-500/10" : "border-border/40 hover:border-border"}`}>
                    <p className="text-sm font-medium flex items-center gap-1.5">{opt.id === "live" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div><label className="text-xs text-muted-foreground">Client ID</label><Input value={form.paypalClientId} onChange={e => set("paypalClientId", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 font-mono text-xs" placeholder="AeA1QIZ...your-paypal-client-id" /></div>
              <div><label className="text-xs text-muted-foreground">Secret Key</label><Input type="password" value={form.paypalSecret} onChange={e => set("paypalSecret", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 font-mono text-xs" placeholder="EGnHDxD...your-paypal-secret" /></div>
              <div><label className="text-xs text-muted-foreground">PayPal Account Email <span className="opacity-60">(optional)</span></label><Input value={form.paypalEmail} onChange={e => set("paypalEmail", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="payments@yourstore.com" /></div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get your {form.paypalMode === "live" ? "Live" : "Sandbox"} credentials from the{" "}
              <a href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2 inline-flex items-center gap-0.5">
                PayPal Developer Dashboard → Apps &amp; Credentials <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Cash on Delivery / manual */}
      <div className={`rounded-2xl border transition-all ${form.codEnabled ? "border-orange-500/20 bg-orange-500/5" : "border-border/30 bg-card/60"}`}>
        <label className="flex items-center justify-between p-5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center"><Banknote className="w-4.5 h-4.5 text-emerald-400" /></div>
            <div><p className="text-sm font-semibold">Cash on Delivery / Pay Your Own Way</p><p className="text-[11px] text-muted-foreground">Let customers pay manually — bank transfer, cash, or off-platform</p></div>
          </div>
          <input type="checkbox" checked={form.codEnabled} onChange={e => set("codEnabled", e.target.checked)} className="accent-orange-500 w-4 h-4" />
        </label>
        {form.codEnabled && (
          <div className="px-5 pb-5 space-y-3 border-t border-border/20 pt-4">
            <div><label className="text-xs text-muted-foreground">Payment Instructions</label>
              <Textarea value={form.codInstructions} onChange={e => set("codInstructions", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-24 resize-none" placeholder="e.g. Transfer to our bank account A/C 123456 (IFSC ABCD0001) and email the receipt to billing@store.com. We'll confirm your order within 24h." />
              <p className="text-[11px] text-muted-foreground mt-1">Shown to customers who choose this option at checkout.</p>
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
        <Save className="w-4 h-4" /> Save Payment Settings
      </Button>
    </div>
  );
}