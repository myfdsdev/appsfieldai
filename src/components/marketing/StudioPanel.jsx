import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2, LayoutGrid, Ratio, Clock, ChevronDown, ImageIcon, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MultiImageUpload from "./MultiImageUpload";
import RecentGallery from "./RecentGallery";
import AspectRatioModal from "./AspectRatioModal";
import { buildStoreContext } from "./storeContext";

const IMAGE_RATIOS = [
  { id: "1:1", label: "Square" },
  { id: "16:9", label: "Landscape" },
  { id: "9:16", label: "Portrait" },
  { id: "4:3", label: "Standard" },
  { id: "3:4", label: "Tall" },
];
const VIDEO_RATIOS = [
  { id: "9:16", label: "Portrait" },
  { id: "16:9", label: "Landscape" },
  { id: "1:1", label: "Square" },
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
  const [ratioOpen, setRatioOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [result, setResult] = useState(null);

  const ratios = mediaType === "video" ? VIDEO_RATIOS : IMAGE_RATIOS;

  useEffect(() => {
    if (seedImageUrl) {
      setRefImages((prev) => (prev.includes(seedImageUrl) ? prev : [...prev, seedImageUrl]));
      onSeedConsumed?.();
      toast.success("Image added as reference.");
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
        setInput(data.enhancedPrompt);
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
    if (!finalPrompt) { toast.error("Pick a scene or write a prompt first."); return; }
    setGenerating(true);
    setResult(null);
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
      setResult(saved);
      setAssets((prev) => [saved, ...prev]);
      toast.success(`${mediaType === "video" ? "Video" : "Image"} generated!`);
    } catch (err) {
      toast.error(err.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const activeRatio = ratios.find((r) => r.id === aspectRatio) || ratios[0];
  const isVideo = mediaType === "video";
  const genLabel = isVideo ? "Video" : "Image";

  return (
    <div className="space-y-6">
      <AspectRatioModal
        open={ratioOpen}
        onClose={() => setRatioOpen(false)}
        ratios={ratios}
        value={aspectRatio}
        onSelect={setAspectRatio}
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: controls ─────────────────────────────── */}
        <div className="space-y-5">
          {/* Pill row: Scene Mode / Aspect Ratio / Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-4 h-4 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Scene Mode</p>
                <p className="text-xs text-muted-foreground truncate">{activePreset ? activePreset.label : "Select style"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRatioOpen(true)}
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 text-left hover:border-border transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                <Ratio className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">Aspect Ratio</p>
                <p className="text-xs text-muted-foreground truncate">{activeRatio.id} · {activeRatio.label}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </div>

          {/* Duration (video only) */}
          {isVideo && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDurationOpen((v) => !v)}
                className="w-full flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 text-left hover:border-border transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">Duration</p>
                  <p className="text-xs text-muted-foreground">{duration} seconds</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
              {durationOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setDuration(d); setDurationOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 ${duration === d ? "text-orange-400 font-semibold" : ""}`}
                    >
                      {d} seconds
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scene Mode big thumbnails */}
          <div>
            <label className="text-sm font-semibold text-foreground">Scene Mode</label>
            <p className="text-xs text-muted-foreground mb-3">{presetLabelPrefix} — pick a style.</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {presets.map((p) => {
                const active = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(active ? "" : p.id)}
                    className={`group relative shrink-0 w-40 h-32 rounded-xl overflow-hidden border-2 transition-all ${
                      active ? "border-orange-500" : "border-transparent hover:border-border"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/70 to-card flex items-center justify-center">
                      <span className="text-4xl opacity-80">{p.emoji}</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-6 pb-2 text-left">
                      <p className="text-xs font-bold text-white leading-tight line-clamp-2">{p.label}</p>
                    </div>
                    {active && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Prompt</label>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={enhancing || !store}
                title="Magic prompt enhancer — writes a better prompt from your store content, scene and text"
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {enhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {enhancing ? "Enhancing…" : "Magic Enhance"}
              </button>
            </div>
            <Textarea
              value={prompt || input}
              onChange={(e) => { setPrompt(e.target.value); setInput(e.target.value); }}
              rows={isVideo ? 5 : 4}
              placeholder={
                isVideo
                  ? "Describe your UGC video, or name a specific software/feature to promote. Then hit Magic Enhance to turn it into a full UGC script + direction."
                  : "Select a scene above or write your own prompt…"
              }
              className="bg-secondary/40 border-border/50 rounded-xl resize-y"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Tip: mention a specific product from your store to feature it directly.
            </p>
          </div>

          {/* Reference images */}
          <div>
            <label className="text-sm font-semibold text-foreground">
              Reference Images {isVideo && <span className="text-muted-foreground font-normal">(person/character for UGC)</span>}
            </label>
            <div className="mt-2">
              <MultiImageUpload value={refImages} onChange={setRefImages} max={5} />
            </div>
          </div>

          {/* Generate — gradient button like the reference */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !store}
            className="w-full h-12 text-white text-base font-semibold gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-teal-500 to-blue-600 hover:opacity-90"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating
              ? isVideo ? "Generating video… this can take a few minutes" : "Generating…"
              : `Generate ${genLabel}`}
          </Button>
        </div>

        {/* ── Right: preview ─────────────────────────────── */}
        <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden lg:sticky lg:top-4">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
            {isVideo ? <VideoIcon className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
            <span className="text-sm font-semibold">Preview</span>
          </div>
          <div className="p-4 min-h-[280px] flex items-center justify-center">
            {generating ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto" />
                <p className="text-xs text-muted-foreground">Generating your {genLabel.toLowerCase()}…</p>
              </div>
            ) : result ? (
              isVideo ? (
                <video src={result.url} controls className="max-h-[360px] w-full rounded-lg" />
              ) : (
                <img src={result.url} alt="Generated" className="max-h-[360px] w-full object-contain rounded-lg" />
              )
            ) : (
              <div className="text-center space-y-3 px-4">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mx-auto">
                  {isVideo ? <VideoIcon className="w-6 h-6 text-muted-foreground/50" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/50" />}
                </div>
                <p className="text-xs text-muted-foreground">Choose a scene and click Generate to see your result here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="border-t border-border/40 pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          {isVideo ? <VideoIcon className="w-4 h-4 text-orange-400" /> : <ImageIcon className="w-4 h-4 text-orange-400" />}
          Recent Generated {isVideo ? "Videos" : "Images"}
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