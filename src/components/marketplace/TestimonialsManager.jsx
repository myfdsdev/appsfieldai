import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Edit2, Star, MessageSquare, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { toast } from "sonner";

const EMPTY = { authorName: "", authorRole: "", authorAvatar: "", rating: 5, content: "", isPublished: true, sortOrder: 0 };

export default function TestimonialsManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null); // null = closed, {} = new/edit
  const [saving, setSaving] = useState(false);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials", marketplaceId],
    queryFn: () => base44.entities.Testimonial.filter({ marketplaceId }, "sortOrder"),
    enabled: !!marketplaceId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["testimonials", marketplaceId] });

  const handleSave = async () => {
    if (!form.authorName?.trim() || !form.content?.trim()) {
      toast.error("Author name and testimonial text are required.");
      return;
    }
    setSaving(true);
    const payload = { ...form, marketplaceId, rating: Number(form.rating) || 5 };
    if (form.id) {
      await base44.entities.Testimonial.update(form.id, payload);
      toast.success("Testimonial updated!");
    } else {
      await base44.entities.Testimonial.create(payload);
      toast.success("Testimonial added!");
    }
    refresh();
    setForm(null);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Testimonial.delete(id);
    refresh();
    toast.success("Testimonial removed.");
  };

  const togglePublish = async (t) => {
    await base44.entities.Testimonial.update(t.id, { isPublished: !t.isPublished });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Add real customer quotes to showcase on your store.</p>
        {!form && (
          <Button onClick={() => setForm({ ...EMPTY, sortOrder: testimonials.length })} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5">
            <Plus className="w-4 h-4" /> Add Testimonial
          </Button>
        )}
      </div>

      {form && (
        <div className="bg-card/60 border border-orange-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{form.id ? "Edit Testimonial" : "New Testimonial"}</p>
            <button onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground">Author Name *</label><Input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Jane Doe" /></div>
            <div><label className="text-xs text-muted-foreground">Role / Company</label><Input value={form.authorRole} onChange={e => setForm(f => ({ ...f, authorRole: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Founder at Acme" /></div>
            <div><label className="text-xs text-muted-foreground">Avatar Image</label><div className="mt-1"><R2ImageUpload value={form.authorAvatar} onChange={(url) => setForm(f => ({ ...f, authorAvatar: url }))} campaignId="testimonial-avatar" placeholder="https://..." /></div></div>
            <div>
              <label className="text-xs text-muted-foreground">Rating</label>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, rating: i + 1 }))}>
                    <Star className={`w-5 h-5 ${i < form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground">Testimonial *</label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-24 resize-none" placeholder="This product completely changed how we work..." /></div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5"><Save className="w-4 h-4" /> Save</Button>
            <Button onClick={() => setForm(null)} variant="outline" className="border-border/40 rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : testimonials.length === 0 && !form ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No testimonials yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/60">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {t.authorAvatar ? <img src={t.authorAvatar} alt={t.authorName} className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{t.authorName[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t.authorName}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  {!t.isPublished && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
                </div>
                {t.authorRole && <p className="text-[11px] text-muted-foreground">{t.authorRole}</p>}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(t)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title={t.isPublished ? "Hide" : "Show"}>
                  {t.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setForm(t)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}