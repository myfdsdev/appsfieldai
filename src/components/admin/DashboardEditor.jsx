import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Pencil, Save, Globe, Type, AlignLeft, MousePointer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DEFAULT_CONFIG = {
  key: "dashboard_hero",
  hero_badge_text: "The Future of SaaS Ownership",
  hero_title_line1: "Split the Price.",
  hero_title_line2: "Own the Software.",
  hero_subtitle: "Join group deals on premium software. Lock a slot, split the cost, and save up to 98% off the full price.",
  hero_cta_primary: "Active deals live now",
  hero_cta_secondary: "Sell My SaaS",
  stat_card_1_label: "Active Deals",
  stat_card_1_value: "50+",
  stat_card_2_label: "Total Savings",
  stat_card_2_value: "$2M+",
  stat_card_3_label: "Happy Buyers",
  stat_card_3_value: "1,200+",
};

export default function DashboardEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["appConfig"],
    queryFn: () => base44.entities.AppConfig.filter({ key: "dashboard_hero" }),
  });

  useEffect(() => {
    if (configs.length > 0) {
      const c = configs[0];
      setExistingId(c.id);
      setForm({ ...DEFAULT_CONFIG, ...c });
    }
  }, [configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await base44.entities.AppConfig.update(existingId, form);
      } else {
        const created = await base44.entities.AppConfig.create(form);
        setExistingId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ["appConfig"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardConfig"] });
      toast.success("Dashboard updated!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const field = (label, key, icon) => (
    <div>
      <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">{icon}{label}</label>
      <Input
        value={form[key] || ""}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="bg-[#252525] border-border/30 rounded-xl text-sm"
      />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero Section Editor */}
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Globe className="w-4 h-4 text-orange-400" />Hero Section
          </CardTitle>
          <Button onClick={handleSave} disabled={saving || isLoading} size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-xl h-8 text-xs">
            <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badge */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Badge</p>
            {field("Badge Text", "hero_badge_text", <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded">badge</span>)}
          </div>

          {/* Headlines */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Headlines</p>
            <div className="space-y-2">
              {field("Headline Line 1 (gradient text)", "hero_title_line1", <Type className="w-3 h-3 text-orange-400" />)}
              {field("Headline Line 2", "hero_title_line2", <Type className="w-3 h-3 text-muted-foreground" />)}
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Subtitle</p>
            {field("Subtitle / Description", "hero_subtitle", <AlignLeft className="w-3 h-3 text-muted-foreground" />)}
          </div>

          {/* CTA Buttons */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">CTA Buttons</p>
            <div className="grid grid-cols-2 gap-3">
              {field("Primary Button", "hero_cta_primary", <MousePointer className="w-3 h-3 text-white" />)}
              {field("Secondary Button", "hero_cta_secondary", <MousePointer className="w-3 h-3 text-orange-400" />)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Editor */}
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Pencil className="w-4 h-4 text-violet-400" />Dashboard Stats Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-[#252525] rounded-xl p-3 space-y-2 border border-border/20">
                <p className="text-[11px] font-medium text-muted-foreground">Stat Card {n}</p>
                <div>
                  <label className="text-[10px] text-muted-foreground">Label</label>
                  <Input value={form[`stat_card_${n}_label`] || ""} onChange={e => setForm(f => ({ ...f, [`stat_card_${n}_label`]: e.target.value }))} className="bg-[#1a1a1a] border-border/30 rounded-lg mt-0.5 h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Value</label>
                  <Input value={form[`stat_card_${n}_value`] || ""} onChange={e => setForm(f => ({ ...f, [`stat_card_${n}_value`]: e.target.value }))} className="bg-[#1a1a1a] border-border/30 rounded-lg mt-0.5 h-8 text-xs" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-xl h-8 text-xs mt-4">
            <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "Saving..." : "Save Stats"}
          </Button>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Globe className="w-4 h-4 text-cyan-400" />Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden border border-border/20 bg-[#0d0d0d] p-6 text-center"
            style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(180,60,10,0.25) 0%, rgba(10,6,3,0) 70%)" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-foreground/70 text-xs mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              {form.hero_badge_text || "Badge text..."}
            </span>
            <h2 className="text-2xl font-display font-extrabold leading-tight mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">{form.hero_title_line1 || "Title Line 1"}</span>
              <br />
              <span className="text-foreground">{form.hero_title_line2 || "Title Line 2"}</span>
            </h2>
            <p className="text-muted-foreground text-xs max-w-xs mx-auto mb-4 line-clamp-2">{form.hero_subtitle || "Subtitle text..."}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <span className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold">{form.hero_cta_primary || "CTA 1"}</span>
              <span className="px-4 py-1.5 rounded-full border border-orange-400/40 text-orange-400 text-xs font-semibold">{form.hero_cta_secondary || "CTA 2"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}