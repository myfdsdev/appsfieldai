import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { toast } from "sonner";

const SECTIONS = [
  { id: "front_end", label: "Front End Bonuses" },
  { id: "bundle", label: "Bundle & Affiliate Bonuses" },
  { id: "download", label: "Downloadable Bonuses" },
];

const emptyForm = { section: "front_end", title: "", description: "", url: "", cta: "Open", thumbnailUrl: "", sortOrder: 0, isActive: true };

export default function BonusManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // record or "new"
  const [form, setForm] = useState(emptyForm);

  const { data: bonuses = [], isLoading } = useQuery({
    queryKey: ["bonusItems"],
    queryFn: () => base44.entities.BonusItem.list("sortOrder"),
  });

  const openNew = () => { setForm(emptyForm); setEditing("new"); };
  const openEdit = (b) => {
    setForm({
      section: b.section || "front_end", title: b.title || "", description: b.description || "",
      url: b.url || "", cta: b.cta || "Open", thumbnailUrl: b.thumbnailUrl || "",
      sortOrder: b.sortOrder || 0, isActive: b.isActive !== false,
    });
    setEditing(b);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Please enter a title."); return; }
    const payload = { ...form, sortOrder: parseInt(form.sortOrder) || 0 };
    if (editing === "new") await base44.entities.BonusItem.create(payload);
    else await base44.entities.BonusItem.update(editing.id, payload);
    queryClient.invalidateQueries({ queryKey: ["bonusItems"] });
    setEditing(null);
    toast.success("Bonus saved");
  };

  const handleDelete = async (b) => {
    await base44.entities.BonusItem.delete(b.id);
    queryClient.invalidateQueries({ queryKey: ["bonusItems"] });
    toast.success("Bonus deleted");
  };

  const toggleActive = async (b) => {
    await base44.entities.BonusItem.update(b.id, { isActive: b.isActive === false });
    queryClient.invalidateQueries({ queryKey: ["bonusItems"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Gift className="w-4 h-4 text-orange-400" />Bonuses
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] ml-2">{bonuses.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />Add Bonus
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : bonuses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No bonuses yet. The Bonus page shows built-in defaults until you add your own.</p>
          ) : SECTIONS.map((sec) => {
            const items = bonuses.filter((b) => (b.section || "front_end") === sec.id);
            if (items.length === 0) return null;
            return (
              <div key={sec.id} className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{sec.label}</p>
                <div className="divide-y divide-border/20">
                  {items.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {b.thumbnailUrl ? (
                          <img src={b.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0"><Gift className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{b.title}{b.isActive === false && <span className="ml-2 text-[10px] text-red-400">(hidden)</span>}</p>
                          {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-orange-400 flex items-center gap-1 truncate">{b.url} <ExternalLink className="w-3 h-3 shrink-0" /></a>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(b)} className="h-8 text-xs text-muted-foreground hover:text-foreground">{b.isActive === false ? "Show" : "Hide"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(b)} className="h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(b)} className="h-8 text-xs text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-foreground flex items-center gap-2"><Gift className="w-4 h-4 text-orange-400" />{editing === "new" ? "Add Bonus" : "Edit Bonus"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Section</label>
              <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="w-full bg-[#252525] border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Title</label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Link URL</label><Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Description (optional)</label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1 h-16 resize-none" /></div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Thumbnail Image</label>
              <div className="mt-1"><R2ImageUpload value={form.thumbnailUrl} onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} accept="image" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Button Label</label><Input value={form.cta} onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))} placeholder="Open" className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Sort Order</label><Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}