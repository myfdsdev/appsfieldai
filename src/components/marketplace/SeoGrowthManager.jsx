import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Search, Newspaper, Wand2, Loader2, Pencil, Trash2, ExternalLink, TrendingUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import BlogEditor from "@/components/marketplace/BlogEditor";

const INTENT_COLORS = {
  transactional: "bg-emerald-500/10 text-emerald-400",
  commercial: "bg-blue-500/10 text-blue-400",
  informational: "bg-violet-500/10 text-violet-400",
};

export default function SeoGrowthManager({ marketplace }) {
  const marketplaceId = marketplace?.id;
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [idea, setIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState(null); // AI draft or existing post being edited

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["storeBlogs", marketplaceId],
    queryFn: () => base44.entities.StoreBlog.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
  });

  const storeBasePath = `/store/${marketplace?.slug}`;

  const genKeywords = async () => {
    setLoadingKeywords(true);
    try {
      const res = await base44.functions.invoke("storeBlogGenerate", { action: "keywords", marketplaceId });
      setKeywords(res.data?.keywords || []);
    } catch (e) {
      toast.error(e.message || "Couldn't generate keywords");
    }
    setLoadingKeywords(false);
  };

  const genBlog = async ({ keyword, ideaText }) => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("storeBlogGenerate", {
        action: "blog",
        marketplaceId,
        ...(keyword ? { keyword } : {}),
        ...(ideaText ? { idea: ideaText } : {}),
      });
      if (res.data?.blog) {
        setDraft(res.data.blog);
        toast.success("Blog draft ready — review and publish");
      } else {
        toast.error("Couldn't generate the blog");
      }
    } catch (e) {
      toast.error(e.message || "Couldn't generate the blog");
    }
    setGenerating(false);
  };

  const handleDelete = async (p) => {
    await base44.entities.StoreBlog.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ["storeBlogs", marketplaceId] });
    toast.success("Blog deleted");
  };

  const afterSave = () => {
    setDraft(null);
    queryClient.invalidateQueries({ queryKey: ["storeBlogs", marketplaceId] });
  };

  if (draft) {
    return <BlogEditor marketplaceId={marketplaceId} initial={draft} onClose={() => setDraft(null)} onSaved={afterSave} />;
  }

  return (
    <div className="space-y-6">
      {/* Keyword Generator */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center"><Search className="w-4 h-4 text-orange-400" /></div>
            <div>
              <p className="text-sm font-semibold">Keyword Generator</p>
              <p className="text-[11px] text-muted-foreground">High-opportunity keywords to rank on Google, based on your store.</p>
            </div>
          </div>
          <Button onClick={genKeywords} disabled={loadingKeywords} variant="outline" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-xl gap-1.5">
            {loadingKeywords ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Keywords
          </Button>
        </div>

        {keywords.length > 0 && (
          <div className="space-y-2">
            {keywords.map((k, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-secondary/20">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{k.keyword}</p>
                    {k.intent && <span className={`text-[10px] px-2 py-0.5 rounded-full ${INTENT_COLORS[String(k.intent).toLowerCase()] || "bg-secondary text-muted-foreground"}`}>{k.intent}</span>}
                  </div>
                  {k.reason && <p className="text-[11px] text-muted-foreground truncate">{k.reason}</p>}
                </div>
                <Button onClick={() => genBlog({ keyword: k.keyword })} disabled={generating} size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg gap-1.5 text-white border-0 shrink-0">
                  <Wand2 className="w-3.5 h-3.5" /> Blog
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Describe an idea → blog */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center"><Lightbulb className="w-4 h-4 text-violet-400" /></div>
          <div>
            <p className="text-sm font-semibold">Write a Blog From Your Idea</p>
            <p className="text-[11px] text-muted-foreground">Describe what's in your mind — we'll write a fully SEO-optimized, editable post.</p>
          </div>
        </div>
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="bg-secondary/50 border-border/30 rounded-xl h-24 resize-none"
          placeholder="e.g. Top CRM tools for agencies in 2025, why lifetime deals beat subscriptions..."
        />
        <Button onClick={() => genBlog({ ideaText: idea })} disabled={generating || !idea.trim()} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl gap-1.5 text-white border-0">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Generate Blog
        </Button>
        {generating && <p className="text-[11px] text-muted-foreground">Writing your article and generating a cover image — this takes ~20 seconds.</p>}
      </div>

      {/* Published blogs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Your Blog Posts</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" /></div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border/40">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No blog posts yet. Generate one above to start attracting organic traffic.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blogs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/60">
                <div className="flex items-center gap-3 min-w-0">
                  {p.coverImageUrl && <img src={p.coverImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">/blog/{p.slug} · {p.isPublished ? "Published" : "Draft"}{p.focusKeyword ? ` · ${p.focusKeyword}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`${storeBasePath}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ExternalLink className="w-4 h-4" /></a>
                  <Button variant="ghost" size="icon" onClick={() => setDraft(p)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} className="h-8 w-8 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}