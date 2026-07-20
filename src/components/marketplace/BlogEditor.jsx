import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Eye } from "lucide-react";
import { toast } from "sonner";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

const slugify = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Full editor for a single SEO blog post. `initial` may be a saved record or a
// freshly AI-generated draft (no id yet).
export default function BlogEditor({ marketplaceId, initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    focusKeyword: initial?.focusKeyword || "",
    metaTitle: initial?.metaTitle || "",
    metaDescription: initial?.metaDescription || "",
    keywords: Array.isArray(initial?.keywords) ? initial.keywords.join(", ") : "",
    excerpt: initial?.excerpt || "",
    coverImageUrl: initial?.coverImageUrl || "",
    content: initial?.content || "",
    isPublished: initial?.isPublished ?? true,
  });
  const [saving, setSaving] = useState(false);
  const isExisting = !!initial?.id;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const payload = {
      marketplaceId,
      title: form.title,
      slug: form.slug.trim() || slugify(form.title),
      focusKeyword: form.focusKeyword,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      excerpt: form.excerpt,
      coverImageUrl: form.coverImageUrl,
      content: form.content,
      isPublished: form.isPublished,
    };
    try {
      if (isExisting) {
        await base44.entities.StoreBlog.update(initial.id, payload);
        toast.success("Blog updated!");
      } else {
        await base44.entities.StoreBlog.create(payload);
        toast.success("Blog published!");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Couldn't save the blog");
    }
    setSaving(false);
  };

  return (
    <div className="bg-card/60 border border-border/40 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold">{isExisting ? "Edit Blog Post" : "Review & Publish Blog"}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Title (H1)</label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Slug</label>
          <Input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="my-post" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Focus Keyword</label>
          <Input value={form.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-secondary/20 p-3 space-y-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SEO Meta Tags</p>
        <div>
          <label className="text-xs text-muted-foreground">Meta Title <span className="opacity-60">({form.metaTitle.length}/60)</span></label>
          <Input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" maxLength={70} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Meta Description <span className="opacity-60">({form.metaDescription.length}/155)</span></label>
          <Textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16 resize-none" maxLength={170} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Keywords (comma separated)</label>
          <Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Excerpt</label>
        <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16 resize-none" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Cover Image</label>
        <div className="mt-1"><R2ImageUpload value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} campaignId="store-blog-cover" placeholder="https://..." /></div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Content (Markdown)</label>
        <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-80 resize-none font-mono text-xs" />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="accent-orange-500 w-4 h-4" />
        Published
      </label>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
        <Save className="w-4 h-4" /> {isExisting ? "Save Changes" : "Publish Blog"}
      </Button>
    </div>
  );
}