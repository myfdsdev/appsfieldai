import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Palette, RotateCcw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { toast } from "sonner";
import { buildHeroBackground } from "@/lib/heroBackground";

const CONFIG_KEY = "marketplace_dashboard_banner";

const DEFAULT_CONFIG = {
  key: CONFIG_KEY,
  hero_title_line1: "Admin Marketplace",
  hero_subtitle: "Manage every user's marketplace across the platform.",
  hero_bg_image_url: "",
  hero_bg_type: "gradient",
  hero_gradient_start: "#7c3aed",
  hero_gradient_middle: "#4c1d95",
  hero_gradient_end: "#0a0603",
  hero_gradient_direction: "to right",
  hero_gradient_intensity: 35,
  hero_bg_solid_color: "#0a0603",
  hero_bg_opacity: 100,
};

const DEFAULT_BG = {
  hero_bg_type: "gradient",
  hero_gradient_start: "#7c3aed",
  hero_gradient_middle: "#4c1d95",
  hero_gradient_end: "#0a0603",
  hero_gradient_direction: "to right",
  hero_gradient_intensity: 35,
  hero_bg_opacity: 100,
};

export default function MarketplaceBannerEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["marketplaceBannerConfig"],
    queryFn: () => base44.entities.AppConfig.filter({ key: CONFIG_KEY }),
  });

  useEffect(() => {
    if (configs && configs.length > 0) {
      setExistingId(configs[0].id);
      setForm({ ...DEFAULT_CONFIG, ...configs[0] });
    }
  }, [configs]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const previewBg = (form.hero_bg_type === "image" && form.hero_bg_image_url)
    ? { backgroundImage: `url(${form.hero_bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : buildHeroBackground(form);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await base44.entities.AppConfig.update(existingId, form);
      } else {
        const created = await base44.entities.AppConfig.create(form);
        setExistingId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ["marketplaceBannerConfig"] });
      toast.success("Marketplace banner updated!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Palette className="w-4 h-4 text-violet-400" />Hero Background
          </CardTitle>
          <Button onClick={() => setForm(f => ({ ...f, ...DEFAULT_BG }))} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />Reset Default
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Background Type</p>
            <div className="flex gap-2">
              {[{ val: "gradient", label: "Gradient" }, { val: "solid", label: "Solid Color" }, { val: "image", label: "Image" }].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set("hero_bg_type", opt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.hero_bg_type === opt.val ? "bg-violet-500/20 text-violet-400 border-violet-500/40" : "bg-[#252525] text-muted-foreground border-border/30 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.hero_bg_type === "gradient" && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Gradient Colors</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "hero_gradient_start", label: "Start" },
                    { key: "hero_gradient_middle", label: "Middle" },
                    { key: "hero_gradient_end", label: "End" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form[key] || "#000000"} onChange={e => set(key, e.target.value)} className="w-8 h-8 rounded-lg border border-border/30 cursor-pointer bg-transparent p-0.5" />
                        <Input value={form[key] || ""} onChange={e => set(key, e.target.value)} className="bg-[#252525] border-border/30 rounded-lg text-xs h-8 font-mono" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Direction</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: "to right", label: "Left → Right" },
                    { val: "to bottom", label: "Top → Bottom" },
                    { val: "diagonal", label: "Diagonal" },
                    { val: "radial", label: "Radial" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => set("hero_gradient_direction", opt.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        form.hero_gradient_direction === opt.val ? "bg-violet-500/20 text-violet-400 border-violet-500/40" : "bg-[#252525] text-muted-foreground border-border/30 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intensity</p>
                  <span className="text-xs text-violet-400 font-mono">{form.hero_gradient_intensity ?? 35}%</span>
                </div>
                <input type="range" min={5} max={80} value={form.hero_gradient_intensity ?? 35} onChange={e => set("hero_gradient_intensity", Number(e.target.value))} className="w-full accent-violet-500 h-1.5 rounded-full" />
              </div>
            </div>
          )}

          {form.hero_bg_type === "solid" && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Background Color</p>
              <div className="flex items-center gap-2">
                <input type="color" value={form.hero_bg_solid_color || "#0a0603"} onChange={e => set("hero_bg_solid_color", e.target.value)} className="w-8 h-8 rounded-lg border border-border/30 cursor-pointer bg-transparent p-0.5" />
                <Input value={form.hero_bg_solid_color || ""} onChange={e => set("hero_bg_solid_color", e.target.value)} className="bg-[#252525] border-border/30 rounded-lg text-xs h-8 font-mono w-40" />
              </div>
            </div>
          )}

          {form.hero_bg_type === "image" && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Cover Image</p>
              <R2ImageUpload
                value={form.hero_bg_image_url || ""}
                onChange={(url) => set("hero_bg_image_url", url)}
                campaignId="marketplace-banner"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Eye className="w-3 h-3" />Live Preview</p>
            <div className="relative h-32 rounded-xl overflow-hidden border border-border/20" style={previewBg}>
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || isLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 rounded-xl h-8 text-xs">
            <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "Saving..." : "Save Background"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}