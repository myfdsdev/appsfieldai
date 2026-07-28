import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2, Square, RectangleHorizontal, RectangleVertical, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MultiImageUpload from "./MultiImageUpload";
import RecentGallery from "./RecentGallery";
import { buildStoreContext } from "./storeContext";

const IMAGE_RATIOS = [
  { id: "1:1", label: "Square", sub: "1:1", icon: Square },
  { id: "4:5", label: "Portrait", sub: "4:5", icon: RectangleVertical },
  { id: "16:9", label: "Landscape", sub: "16:9", icon: RectangleHorizontal },
  { id: "9:16", label: "Story", sub: "9:16", icon: Smartphone },
];
const VIDEO_RATIOS = [
  { id: "9:16", label: "Vertical", sub: "9:16", icon: Smartphone },
  { id: "16:9", label: "Landscape", sub: "16:9", icon: RectangleHorizontal },
  { id: "1:1", label: "Square", sub: "1:1", icon: Square },
  { id: "4:5", label: "Portrait", sub: "4:5", icon: RectangleVertical },
];
const DURATIONS = [4, 6, 8];

export default function StudioPanel({ mediaType, store, presets, presetLabelPrefix, seedImageUrl, onSeedConsumed }) {
  const [presetId, setPresetId] = useState("");
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(mediaType === "video" ? "9:16" : "1:1");
  const [duration, setDuration] = useState(8);
  const [refImages, setRefImages] = useState([]);
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const ratios = mediaType === "video" ? VIDEO_RATIOS : IMAGE_RATIOS;

  // A seed image handed over from "Use this image for video production".
  useEffect(() => {
    if (seedImageUrl) {
      setRefImages((prev) => (prev.includes(seedImageUrl) ? prev : [...prev, seedImageUrl]));
      onSeedConsumed?.();
      toast.success("Image added as video reference.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedImageUrl]);

  const loadAssets = async () => {
    if (!store?.id) { setAssets([]); setLoadingAssets(false); return; }
    setLoadingAssets(true);
    try {
      const rows = await base44.entities.MarketingAsset.filter(
        { marketplaceId: store.id, mediaType },
        "-created_date",
        24
      );
      setAssets(rows);
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, mediaType]);

  const activePreset = presets.find((p) => p.id === presetId) || null;

  const handleEnhance = async () => {
    if (!store) { toast.error("Choose a store first."); return; }
    setEnhancing(true);
    try {
      const res = await base44.functions.invoke("marketingEnhancePrompt", {
        mediaType,
        storeContext: buildStoreContext(store),
        presetLabel: activePreset?.label || "",
        presetPrompt: activePreset?.prompt || "",
        userInput: input.trim(),
        aspectRatio,
        duration,
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        toast.success("Prompt enhanced with your store's content.");
      } else {
        throw new Error("No prompt returned.");
      }
    } catch (err) {
      toast.error(err.message || "Couldn't enhance the prompt.");
    } finally {
      setEnhancing(false);
    }
  };

  // Resolve the prompt to actually generate with: use the enhanced/edited prompt
  // if present, else combine preset direction + input.
  const resolvePrompt = () => {
    if (prompt.trim()) return prompt.trim();
    const parts = [];
    if (activePreset?.prompt) parts.push(activePreset.prompt);
    if (input.trim()) parts.push(input.trim());
    const ctx = buildStoreContext(store);
    if (ctx) parts.push(`Product/store context: ${ctx}`);
    return parts.join("\n\n");
  };

  const handleGenerate = async () => {
    if (!store) { toast.error("Choose a store first."); return; }
    const finalPrompt = resolvePrompt();
    if (!finalPrompt) { toast.error("Pick a preset or write a prompt first."); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("marketingGenerate", {
        mediaType,
        prompt: finalPrompt,
        referenceImageUrls: refImages,
        aspectRatio,
        duration,
      });
      const data = res.data || {};
      if (data.error || !data.url) throw new Error(data.error || "Generation failed.");
      const saved = await base44.entities.MarketingAsset.create({
        ownerId: store.ownerId,
        marketplaceId: store.id,
        storeName: store.name,
        mediaType,
        url: data.url,
        prompt: finalPrompt,
        presetId: presetId || "",
        aspectRatio,
        ...(mediaType === "video" ? { duration } : {}),
      });
      setAssets((prev) => [saved, ...prev]);
      toast.success(`${mediaType === "video" ? "Video" : "Image"} generated!`);
    } catch (err) {
      toast.error(err.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <label className="text-sm font-semibold text-foreground">Marketing Presets</label>
        <p className="text-xs text-muted-foreground mb-3">{presetLabelPrefix} — pick a style, then optionally tweak the prompt.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(active ? "" : p.id)}
                className={`text-left rounded-xl border-2 p-3 transition-all ${
                  active ? "border-orange-500 bg-orange-500/10" : "border-border/40 hover:border-border"
                }`}
              >
                <div className="text-xl mb-1">{p.emoji}</div>
                <p className="text-xs font-semibold leading-tight">{p.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt input + enhancer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-foreground">Your Prompt</label>
          <button
            type="button"
            onClick={handleEnhance}
            disabled={enhancing || !store}
            title="Magic prompt enhancer — writes a better prompt from your store content, preset and text"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {enhancing ? "Enhancing…" : "Magic Enhance"}
          </button>
        </div>
        <Textarea
          value={prompt || input}
          onChange={(e) => { setPrompt(e.target.value); setInput(e.target.value); }}
          rows={mediaType === "video" ? 5 : 4}
          placeholder={
            mediaType === "video"
              ? "Describe your UGC video, or name a specific software/feature to promote. Then hit Magic Enhance to turn it into a full UGC script + direction."
              : "Describe your promo graphic, or name a specific software/feature. Then hit Magic Enhance to craft a designer-grade prompt from your store content."
          }
          className="bg-secondary/40 border-border/50 rounded-xl resize-y"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Tip: mention a specific product from your store to feature it directly.
        </p>
      </div>

      {/* Aspect ratio */}
      <div>
        <label className="text-sm font-semibold text-foreground">Aspect Ratio</label>
        <div className="grid grid-cols-4 gap-2.5 mt-2">
          {ratios.map((r) => {
            const active = aspectRatio === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setAspectRatio(r.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all ${
                  active ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-border/40 hover:border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold text-foreground">{r.label}</span>
                <span className="text-[10px]">{r.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video duration */}
      {mediaType === "video" && (
        <div>
          <label className="text-sm font-semibold text-foreground">Duration</label>
          <div className="flex gap-2.5 mt-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                  duration === d ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-border/40 hover:border-border"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reference images */}
      <div>
        <label className="text-sm font-semibold text-foreground">
          Reference Images {mediaType === "video" && <span className="text-muted-foreground font-normal">(person/character for UGC)</span>}
        </label>
        <div className="mt-2">
          <MultiImageUpload value={refImages} onChange={setRefImages} max={5} />
        </div>
      </div>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !store}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold gap-2"
      >
        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {generating
          ? mediaType === "video" ? "Generating video… this can take a few minutes" : "Generating…"
          : `Generate ${mediaType === "video" ? "Video" : "Image"}`}
      </Button>

      {/* Recent */}
      <div className="border-t border-border/40 pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Recent {mediaType === "video" ? "Videos" : "Images"}
        </h3>
        <RecentGallery
          assets={assets}
          loading={loadingAssets}
          mediaType={mediaType}
          onUseForVideo={mediaType === "image" ? (url) => window.dispatchEvent(new CustomEvent("marketing:useForVideo", { detail: url })) : undefined}
        />
      </div>
    </div>
  );
}