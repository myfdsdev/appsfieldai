import React from "react";
import { Plus, X, Mail, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

// Controlled editor for a product's affiliate promotion kit: banner images,
// promo videos, email swipes, and a rich LLM description affiliates feed to AI.
// `value` is the promotionKit object; `onChange` receives the updated object.
export default function PromotionKitEditor({ value, onChange }) {
  const kit = {
    images: value?.images || [],
    videos: value?.videos || [],
    emailSwipes: value?.emailSwipes || [],
    llmDescription: value?.llmDescription || "",
  };

  const patch = (p) => onChange({ ...kit, ...p });

  const addImage = (url) => url && patch({ images: [...kit.images, url] });
  const removeImage = (i) => patch({ images: kit.images.filter((_, j) => j !== i) });

  const addVideo = () => patch({ videos: [...kit.videos, ""] });
  const setVideo = (i, v) => patch({ videos: kit.videos.map((x, j) => (j === i ? v : x)) });
  const removeVideo = (i) => patch({ videos: kit.videos.filter((_, j) => j !== i) });

  const addSwipe = () => patch({ emailSwipes: [...kit.emailSwipes, { subject: "", body: "" }] });
  const setSwipe = (i, field, v) => patch({ emailSwipes: kit.emailSwipes.map((s, j) => (j === i ? { ...s, [field]: v } : s)) });
  const removeSwipe = (i) => patch({ emailSwipes: kit.emailSwipes.filter((_, j) => j !== i) });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
        <p className="text-xs text-orange-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> These marketing materials appear in the <b>Promotion Kit</b> tab for approved affiliates of this product.
        </p>
      </div>

      {/* Banner Images */}
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5" /> Banner / Creative Images</label>
        <R2ImageUpload value="" onChange={addImage} campaignId="promo-kit-image" placeholder="Upload a banner or paste an image URL" />
        {kit.images.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {kit.images.map((s, i) => (
              <div key={i} className="relative group">
                <img src={s} alt="" className="w-20 h-14 rounded-lg object-cover border border-border/30" />
                <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Promo Videos</label>
          <Button onClick={addVideo} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs h-7"><Plus className="w-3.5 h-3.5" /> Add</Button>
        </div>
        <div className="space-y-2">
          {kit.videos.length === 0 && <p className="text-[11px] text-muted-foreground">No promo videos added.</p>}
          {kit.videos.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={v} onChange={(e) => setVideo(i, e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" placeholder="https://youtube.com/... or video URL" />
              <Button onClick={() => removeVideo(i)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-400 shrink-0"><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Swipes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Swipes</label>
          <Button onClick={addSwipe} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs h-7"><Plus className="w-3.5 h-3.5" /> Add Swipe</Button>
        </div>
        <div className="space-y-3">
          {kit.emailSwipes.length === 0 && <p className="text-[11px] text-muted-foreground">No email swipes yet — add ready-to-send emails affiliates can copy.</p>}
          {kit.emailSwipes.map((s, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-secondary/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input value={s.subject} onChange={(e) => setSwipe(i, "subject", e.target.value)} className="bg-secondary/50 border-border/30 rounded-lg text-sm" placeholder="Email subject line" />
                <Button onClick={() => removeSwipe(i)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-400 shrink-0"><X className="w-4 h-4" /></Button>
              </div>
              <Textarea value={s.body} onChange={(e) => setSwipe(i, "body", e.target.value)} className="bg-secondary/50 border-border/30 rounded-lg h-24 resize-none text-sm" placeholder="Email body copy..." />
            </div>
          ))}
        </div>
      </div>

      {/* LLM Description */}
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5" /> AI Copy Brief</label>
        <p className="text-[11px] text-muted-foreground mb-2">A rich product description affiliates can paste into an AI to generate their own emails, ads, and social posts.</p>
        <Textarea value={kit.llmDescription} onChange={(e) => patch({ llmDescription: e.target.value })} className="bg-secondary/50 border-border/30 rounded-xl h-32 resize-none" placeholder="Describe the product, its benefits, target audience, key selling points, and tone for AI-generated marketing copy..." />
      </div>
    </div>
  );
}