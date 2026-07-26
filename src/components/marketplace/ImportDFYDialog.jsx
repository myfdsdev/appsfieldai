import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search, Download, Loader2, Package, CheckCheck, Play, Video, KeyRound, X } from "lucide-react";

// Extract the 11-char YouTube video ID (or null for non-YouTube URLs).
function youtubeId(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
const isVideoFile = (url = "") => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

// Fullscreen lightbox that plays the demo video over the whole dialog.
function VideoLightbox({ url, title, onClose }) {
  const id = youtubeId(url);
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
        <X className="w-5 h-5" />
      </button>
      <div className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={title}
          />
        ) : (
          <video src={url} className="w-full h-full object-contain bg-black" controls autoPlay />
        )}
      </div>
    </div>
  );
}

// Small media preview: thumbnail image, YouTube poster, or gradient fallback.
function ProductMedia({ p, onPlay }) {
  const ytId = youtubeId(p.demoVideoUrl);
  const hasVideo = !!p.demoVideoUrl;
  const hasAdmin = p.adminAccessType && p.adminAccessType !== "none";
  // Prefer the explicit thumbnail; else the YouTube poster; else the logo.
  const poster = p.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${p.imageGradient || "from-orange-500 to-amber-500"}`}>
      {poster ? (
        <img src={poster} alt={p.softwareName} className="w-full h-full object-cover" />
      ) : p.logo ? (
        <img src={p.logo} alt={p.softwareName} className="w-full h-full object-contain p-4 bg-black/20" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">{(p.softwareName || "?")[0]}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/15" />

      {/* Corner badges */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        {hasVideo && (
          <span className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
            <Video className="w-2.5 h-2.5" /> Demo
          </span>
        )}
        {hasAdmin && (
          <span className="flex items-center gap-0.5 bg-orange-500/90 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
            <KeyRound className="w-2.5 h-2.5" /> Admin
          </span>
        )}
      </div>

      {hasVideo && (
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(p.demoVideoUrl); }}
          className="absolute inset-0 flex items-center justify-center hover:bg-black/25 transition-colors"
        >
          <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
          </span>
        </button>
      )}
    </div>
  );
}

// Popup that lets a store owner pick which DFY products to import (multi-select grid).
export default function ImportDFYDialog({ open, onClose, existingNames = [], importing, onImport }) {
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [videoUrl, setVideoUrl] = useState(null); // demo video playing in the lightbox

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["dfyProductsActive"],
    queryFn: () => base44.entities.DFYProduct.filter({ isActive: true }),
    enabled: open,
  });

  const existing = useMemo(
    () => new Set(existingNames.map((n) => (n || "").trim().toLowerCase())),
    [existingNames]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presets.filter((p) => {
      if (!q) return true;
      return (
        (p.softwareName || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    });
  }, [presets, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectableIds = filtered
    .filter((p) => !existing.has((p.softwareName || "").trim().toLowerCase()))
    .map((p) => p.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleAll = () => setSelected(() => (allSelected ? new Set() : new Set(selectableIds)));

  const handleImport = () => onImport(presets.filter((p) => selected.has(p.id)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-orange-400" /> Import DFY Products
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-xl" placeholder="Search products" />
          </div>
          {selectableIds.length > 0 && (
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 shrink-0 sm:px-2">
              <CheckCheck className="w-3.5 h-3.5" /> {allSelected ? "Clear selection" : "Select all"}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {isLoading ? (
            <div className="text-center py-16 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-8 h-8 mx-auto mb-2 text-orange-400/40" />
              <p className="text-sm text-muted-foreground">No DFY products available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const already = existing.has((p.softwareName || "").trim().toLowerCase());
                const isSel = selected.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border overflow-hidden transition-all ${
                      already
                        ? "border-border/20 bg-secondary/20 opacity-60"
                        : isSel
                        ? "border-orange-500/60 bg-orange-500/5 ring-1 ring-orange-500/40"
                        : "border-border/40 bg-card/40 hover:border-orange-500/30"
                    }`}
                  >
                    <div className="p-2 pb-0">
                      <ProductMedia p={p} onPlay={setVideoUrl} />
                    </div>
                    <button
                      disabled={already}
                      onClick={() => toggle(p.id)}
                      className={`w-full text-left p-3 flex items-start gap-2 ${already ? "cursor-not-allowed" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.softwareName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {p.category}
                          {p.discountPrice > 0 && ` · $${p.discountPrice}`}
                        </p>
                        {p.adminAccessType && p.adminAccessType !== "none" && (
                          <p className="text-[10px] text-orange-400 mt-0.5">Admin access included</p>
                        )}
                      </div>
                      {already ? (
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">Imported</span>
                      ) : (
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${isSel ? "bg-orange-500 border-orange-500" : "border-border/60"}`}>
                          {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import {selected.size > 0 ? selected.size : ""}
            </Button>
          </div>
        </div>
      </DialogContent>

      {videoUrl && <VideoLightbox url={videoUrl} title="Demo video" onClose={() => setVideoUrl(null)} />}
    </Dialog>
  );
}