import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

const ICON_OPTIONS = [
  { value: "verified", label: "Verified ✔" },
  { value: "gdpr", label: "GDPR / Compliance" },
  { value: "paypal", label: "PayPal / Card" },
  { value: "stripe", label: "Stripe / Card" },
  { value: "shield", label: "Shield" },
  { value: "lock", label: "Secure Lock" },
  { value: "award", label: "Award" },
  { value: "globe", label: "Globe" },
];

const PRESETS = [
  { icon: "gdpr", text: "GDPR Compliant" },
  { icon: "paypal", text: "Verified Payments by PayPal" },
  { icon: "stripe", text: "Secured by Stripe" },
  { icon: "verified", text: "Verified by AppsfieldAI" },
];

// Editor for the trust/policy badges strip (GDPR, verified payments, verified by AppsfieldAI…).
export default function TrustBadgesEditor({ form, setForm }) {
  const badges = form.trustBadges || [];

  const update = (i, key, val) =>
    setForm((f) => {
      const next = [...(f.trustBadges || [])];
      next[i] = { ...next[i], [key]: val };
      return { ...f, trustBadges: next };
    });

  const add = (preset) =>
    setForm((f) => ({ ...f, trustBadges: [...(f.trustBadges || []), preset || { icon: "verified", text: "", link: "", imageUrl: "" }] }));

  const remove = (i) =>
    setForm((f) => ({ ...f, trustBadges: (f.trustBadges || []).filter((_, idx) => idx !== i) }));

  const addedTexts = new Set(badges.map((b) => (b.text || "").toLowerCase()));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground">Section Heading (optional)</label>
        <Input
          value={form.trustBadgesTitle || ""}
          onChange={(e) => setForm((f) => ({ ...f, trustBadgesTitle: e.target.value }))}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1"
          placeholder="Trusted & Secure"
        />
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.filter((p) => !addedTexts.has(p.text.toLowerCase())).map((p) => (
          <button
            key={p.text}
            onClick={() => add(p)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/50 border border-border/30 text-[11px] text-muted-foreground hover:text-foreground hover:border-orange-500/40 transition-colors"
          >
            <Plus className="w-3 h-3" /> {p.text}
          </button>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-6 rounded-xl border border-dashed border-border/40 text-muted-foreground">
          <ShieldCheck className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
          <p className="text-xs">Add trust factors to reassure buyers.</p>
        </div>
      )}

      <div className="space-y-3">
        {badges.map((b, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-secondary/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Badge {i + 1}</span>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Icon</label>
                <select
                  value={b.icon || "verified"}
                  onChange={(e) => update(i, "icon", e.target.value)}
                  className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-2.5 py-2 text-xs"
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Text</label>
                <Input value={b.text || ""} onChange={(e) => update(i, "text", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 text-xs" placeholder="GDPR Compliant" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Link (optional)</label>
              <Input value={b.link || ""} onChange={(e) => update(i, "link", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 text-xs" placeholder="https://..." />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Custom Badge Image (optional — overrides icon)</label>
              <div className="mt-1">
                <R2ImageUpload value={b.imageUrl} onChange={(url) => update(i, "imageUrl", url)} campaignId="trust-badge" placeholder="https://..." />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => add()} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs">
        <Plus className="w-3.5 h-3.5" /> Add Custom Badge
      </Button>
    </div>
  );
}