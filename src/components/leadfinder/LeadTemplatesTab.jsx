import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Sparkles, Loader2, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// Owner's email templates + an AI generator that pulls context from a chosen store.
export default function LeadTemplatesTab({ ownerId, stores = [] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", storeName: "" });
  const [genStore, setGenStore] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["leadTemplates", ownerId],
    queryFn: () => base44.entities.LeadEmailTemplate.filter({ ownerId }, "-created_date"),
    enabled: !!ownerId,
  });

  const openCreate = () => { setForm({ name: "", subject: "", body: "", storeName: stores[0]?.name || "" }); setEdit(null); setGenStore(stores[0]?.id || ""); setOpen(true); };
  const openEdit = (t) => { setForm({ name: t.name, subject: t.subject || "", body: t.body || "", storeName: t.storeName || "" }); setEdit(t); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) { toast.error("Name and message are required"); return; }
    if (edit) await base44.entities.LeadEmailTemplate.update(edit.id, form);
    else await base44.entities.LeadEmailTemplate.create({ ...form, ownerId });
    queryClient.invalidateQueries({ queryKey: ["leadTemplates", ownerId] });
    toast.success("Template saved");
    setOpen(false);
  };

  const handleDelete = async (t) => {
    await base44.entities.LeadEmailTemplate.delete(t.id);
    queryClient.invalidateQueries({ queryKey: ["leadTemplates", ownerId] });
    toast.success("Template deleted");
  };

  const handleGenerate = async () => {
    const store = stores.find((s) => s.id === genStore);
    if (!store) { toast.error("Select a store first"); return; }
    setGenerating(true);
    try {
      const offering = store.description || `products and software sold on ${store.name}`;
      const r = await base44.functions.invoke("leadFinder", { action: "generateEmail", storeName: store.name, offering, purpose: "invite them to explore and buy software from the store" });
      const data = r?.data || r;
      if (data?.error) throw new Error(data.error);
      setForm((f) => ({ ...f, storeName: store.name, subject: data.subject || f.subject, body: data.body || f.body }));
      toast.success("Email generated — review and save.");
    } catch (e) {
      toast.error(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Reusable email templates. Use <code className="text-orange-400">{"{{first_name}}"}</code>, <code className="text-orange-400">{"{{business_name}}"}</code>, <code className="text-orange-400">{"{{business_description}}"}</code>, <code className="text-orange-400">{"{{store_name}}"}</code>.</p>
        <Button onClick={openCreate} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> New Template</Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /> No templates yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  {t.storeName && <p className="text-[11px] text-muted-foreground">for {t.storeName}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)} className="h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(t)} className="h-7 w-7 p-0 text-red-400/70 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {t.subject && <p className="text-xs font-medium truncate">{t.subject}</p>}
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/40 max-w-lg rounded-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">{edit ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-2">
              <p className="text-xs font-medium flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-orange-400" /> AI Email Generator</p>
              <div className="flex gap-2">
                <select value={genStore} onChange={(e) => setGenStore(e.target.value)} className="flex-1 bg-secondary/50 border border-border/30 rounded-xl px-3 py-2 text-sm">
                  <option value="">Select store for context…</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button onClick={handleGenerate} disabled={generating} className="gap-1.5 shrink-0">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate
                </Button>
              </div>
            </div>
            <div><Label className="text-xs">Template Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="e.g. Store invite" /></div>
            <div><Label className="text-xs">Subject</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="mt-1" placeholder="Subject line" /></div>
            <div><Label className="text-xs">Message</Label><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="mt-1 h-48 resize-none" placeholder="Hi {{first_name}}, ..." /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} className="gap-2 rounded-xl"><Save className="w-4 h-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}