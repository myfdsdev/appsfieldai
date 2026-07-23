import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Palette, Save, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { STORE_STYLES } from "@/components/store/storeStyles";

// Admin manager for the store theme preview screenshots. Each theme gets a
// full-page screenshot URL; store owners see a "Preview" button on the theme
// in the picker that opens this image full-width and scrollable.
export default function MarketplaceThemeManager() {
  const [recordId, setRecordId] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.StorePageDefault.filter({ key: "default" }).then(rows => {
      if (rows?.[0]) {
        setRecordId(rows[0].id);
        setThumbnails(rows[0].themeThumbnails || {});
        setNames(rows[0].themeNames || {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setThumb = (slug, url) => setThumbnails(t => ({ ...t, [slug]: url }));
  const setName = (slug, name) => setNames(n => ({ ...n, [slug]: name }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { themeThumbnails: thumbnails, themeNames: names };
      if (recordId) {
        await base44.entities.StorePageDefault.update(recordId, payload);
      } else {
        const created = await base44.entities.StorePageDefault.create({ key: "default", ...payload });
        setRecordId(created.id);
      }
      toast.success("Themes saved.");
    } catch {
      toast.error("Could not save themes. Try again.");
    }
    setSaving(false);
  };

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Palette className="w-4 h-4 text-violet-400" />Marketplace Theme
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Rename each store theme and upload a full-page screenshot. Store owners see the theme name plus a <span className="text-foreground font-medium">Preview</span> button in the picker that opens the screenshot full-width and scrollable.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {STORE_STYLES.map(s => (
            <div key={s.slug} className="p-3 rounded-xl bg-secondary/20">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                {names[s.slug] || s.name} <span className="text-muted-foreground font-normal">— {s.tagline}</span>
              </p>
              <div className="mb-2">
                <label className="text-[11px] text-muted-foreground block mb-1">Theme name</label>
                <Input
                  value={names[s.slug] ?? ""}
                  onChange={(e) => setName(s.slug, e.target.value)}
                  placeholder={s.name}
                />
              </div>
              <R2ImageUpload
                value={thumbnails[s.slug] || ""}
                onChange={(url) => setThumb(s.slug, url)}
                campaignId={`theme-preview-${s.slug}`}
                placeholder="Full-page screenshot URL"
              />
            </div>
          ))}
          <div className="pt-3 border-t border-border/30 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5"><Save className="w-4 h-4" />Save Themes</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}