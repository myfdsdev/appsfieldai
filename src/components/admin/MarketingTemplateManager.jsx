import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Wand2, Image as ImageIcon, Video, Loader2, Pencil, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { IMAGE_PRESETS, VIDEO_PRESETS } from "@/components/marketing/marketingPresets";

const MEDIA_TABS = [
  { id: "image", label: "Image Templates", icon: ImageIcon, presets: IMAGE_PRESETS },
  { id: "video", label: "Video Templates", icon: Video, presets: VIDEO_PRESETS },
];

export default function MarketingTemplateManager() {
  const [mediaType, setMediaType] = useState("image");
  const [overrides, setOverrides] = useState({}); // key: `${mediaType}|${presetId}` -> record
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { preset, mediaType }
  const [form, setForm] = useState({ label: "", prompt: "", thumbnailUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.MarketingPresetOverride.list();
      const map = {};
      rows.forEach((r) => { map[`${r.mediaType}|${r.presetId}`] = r; });
      setOverrides(map);
    } catch {
      setOverrides({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeTab = MEDIA_TABS.find((t) => t.id === mediaType);
  const presets = activeTab.presets;

  const getOverride = (presetId) => overrides[`${mediaType}|${presetId}`] || null;

  const openEdit = (preset) => {
    const o = getOverride(preset.id);
    setEditing({ preset });
    setForm({
      label: o?.label || "",
      prompt: o?.prompt || "",
      thumbnailUrl: o?.thumbnailUrl || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const existing = getOverride(editing.preset.id);
      const data = {
        presetId: editing.preset.id,
        mediaType,
        label: form.label.trim(),
        prompt: form.prompt.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
      };
      if (existing) {
        await base44.entities.MarketingPresetOverride.update(existing.id, data);
      } else {
        await base44.entities.MarketingPresetOverride.create(data);
      }
      toast.success("Template updated");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Couldn't save the template.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (preset) => {
    const existing = getOverride(preset.id);
    if (!existing) return;
    try {
      await base44.entities.MarketingPresetOverride.delete(existing.id);
      toast.success("Reset to default");
      await load();
    } catch (err) {
      toast.error(err.message || "Couldn't reset.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Wand2 className="w-4 h-4 text-violet-400" />
            Marketing Studio Templates
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Customize the title, base prompt and thumbnail for each Stores Marketing Studio template. These are used across all users' studios.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Media type tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-secondary/40 w-fit">
            {MEDIA_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setMediaType(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  mediaType === t.id ? "bg-orange-500 text-white shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {presets.map((p) => {
                const o = getOverride(p.id);
                const label = o?.label?.trim() || p.label;
                const thumb = o?.thumbnailUrl;
                const customized = !!o;
                return (
                  <div key={p.id} className="group relative rounded-xl overflow-hidden border border-border/40 bg-secondary/30">
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary via-secondary/70 to-card flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl opacity-80">{p.emoji}</span>
                      )}
                      {customized && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-500 text-white">Custom</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-foreground leading-tight line-clamp-2 min-h-[2rem]">{label}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground flex-1">
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        {customized && (
                          <Button size="sm" variant="ghost" onClick={() => handleReset(p)} title="Reset to default" className="h-7 px-2 text-[11px] text-red-400/70 hover:text-red-400">
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-violet-400" /> Edit Template
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder={editing.preset.label}
                  className="bg-[#252525] border-border/30 rounded-xl mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use the default: “{editing.preset.label}”.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Base Prompt</label>
                <Textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder={editing.preset.prompt}
                  rows={6}
                  className="bg-[#252525] border-border/30 rounded-xl mt-1 resize-y"
                />
                <p className="text-[10px] text-muted-foreground mt-1">The design direction fed to the generator. Leave empty to use the built-in default.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Custom Thumbnail</label>
                <div className="mt-1">
                  <R2ImageUpload
                    value={form.thumbnailUrl}
                    onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
                    campaignId="marketing-template"
                    placeholder="https://example.com/thumbnail.png"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use the auto-generated preview.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 rounded-xl gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}