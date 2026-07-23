import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Globe, Save, Plus, Trash2, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EMPTY = {
  headerEnabled: true, headerTitle: "", headerSubtitle: "",
  productsEnabled: true, productsSectionTitle: "One In A Lifetime Deals",
  testimonialsEnabled: true, testimonialsTitle: "What Our Customers Say",
  customBoxesEnabled: true, customBoxes: [],
  footerEnabled: true, footerText: "",
};

const TOGGLES = [
  { key: "headerEnabled", label: "Store Header", desc: "Logo, title and subtitle at the top" },
  { key: "productsEnabled", label: "Products Section", desc: "Searchable grid of lifetime deals" },
  { key: "testimonialsEnabled", label: "Testimonials", desc: "Customer reviews section" },
  { key: "customBoxesEnabled", label: "Custom Boxes", desc: "Feature highlight boxes" },
  { key: "footerEnabled", label: "Footer", desc: "Bottom footer with store info" },
];

export default function StorePageDefaultManager() {
  const [recordId, setRecordId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.StorePageDefault.filter({ key: "default" }).then(rows => {
      if (rows?.[0]) {
        setRecordId(rows[0].id);
        setForm({ ...EMPTY, ...(rows[0].pageSections || {}) });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setBox = (i, k, v) => setForm(f => ({ ...f, customBoxes: f.customBoxes.map((b, idx) => idx === i ? { ...b, [k]: v } : b) }));
  const addBox = () => setForm(f => ({ ...f, customBoxes: [...(f.customBoxes || []), { title: "", text: "" }] }));
  const removeBox = (i) => setForm(f => ({ ...f, customBoxes: f.customBoxes.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) {
        await base44.entities.StorePageDefault.update(recordId, { pageSections: form });
      } else {
        const created = await base44.entities.StorePageDefault.create({ key: "default", pageSections: form });
        setRecordId(created.id);
      }
      toast.success("Default store page saved — new marketplaces will use it.");
    } catch {
      toast.error("Could not save defaults. Try again.");
    }
    setSaving(false);
  };

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <LayoutTemplate className="w-4 h-4 text-cyan-400" />Default Store Page
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">This content is applied automatically to every new marketplace's store page. Owners can customize it afterward.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Section toggles */}
          <div className="space-y-2">
            {TOGGLES.map(t => (
              <label key={t.key} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                <input type="checkbox" checked={!!form[t.key]} onChange={e => set(t.key, e.target.checked)} className="mt-0.5 accent-cyan-500" />
                <div><p className="text-sm font-medium text-foreground">{t.label}</p><p className="text-[11px] text-muted-foreground">{t.desc}</p></div>
              </label>
            ))}
          </div>

          {/* Header text */}
          <div className="grid grid-cols-1 gap-3">
            <div><label className="text-xs text-muted-foreground">Header Title</label><Input value={form.headerTitle} onChange={e => set("headerTitle", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="Leave blank to use the store name" /></div>
            <div><label className="text-xs text-muted-foreground">Header Subtitle</label><Input value={form.headerSubtitle} onChange={e => set("headerSubtitle", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1" placeholder="Leave blank to show listing count" /></div>
            <div><label className="text-xs text-muted-foreground">Products Section Title</label><Input value={form.productsSectionTitle} onChange={e => set("productsSectionTitle", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Testimonials Title</label><Input value={form.testimonialsTitle} onChange={e => set("testimonialsTitle", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Footer Text</label><Textarea value={form.footerText} onChange={e => set("footerText", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 h-20" placeholder="Leave blank for the default copyright line" /></div>
          </div>

          {/* Custom boxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Custom Feature Boxes</label>
              <Button size="sm" variant="outline" onClick={addBox} className="border-border/40 rounded-lg h-7 text-xs gap-1"><Plus className="w-3 h-3" />Add Box</Button>
            </div>
            {(form.customBoxes || []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">No custom boxes — defaults (Secure Checkout, Instant Access, Support) will be shown.</p>
            ) : (
              <div className="space-y-2">
                {form.customBoxes.map((b, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-secondary/20">
                    <div className="flex-1 space-y-2">
                      <Input value={b.title || ""} onChange={e => setBox(i, "title", e.target.value)} className="bg-[#252525] border-border/30 rounded-lg" placeholder="Box title" />
                      <Input value={b.text || ""} onChange={e => setBox(i, "text", e.target.value)} className="bg-[#252525] border-border/30 rounded-lg" placeholder="Box description" />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeBox(i)} className="text-red-400/60 hover:text-red-400 h-8 w-8 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/30 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5"><Save className="w-4 h-4" />Save Default</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}