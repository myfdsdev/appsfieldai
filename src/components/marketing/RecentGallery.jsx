import React from "react";
import { Download, Video as VideoIcon, Clapperboard, Loader2 } from "lucide-react";

// Force a real file download (the `download` attr is ignored for cross-origin R2 URLs).
async function downloadAsset(url, mediaType) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `appsfield-${mediaType}-${Date.now()}.${mediaType === "video" ? "mp4" : "png"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// Shows the recent generated assets for the active media type.
export default function RecentGallery({ assets = [], loading, mediaType, onUseForVideo }) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }
  if (!assets.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Your generated {mediaType === "video" ? "videos" : "images"} will appear here.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((a) => (
        <div key={a.id} className="rounded-xl overflow-hidden border border-border/40 bg-secondary/20 group">
          <div className="relative aspect-square bg-black/20">
            {a.mediaType === "video" ? (
              <video src={a.url} className="w-full h-full object-contain" controls />
            ) : (
              <img src={a.url} alt="generated" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="p-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => downloadAsset(a.url, a.mediaType)}
              className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Save
            </button>
            {a.mediaType === "image" && onUseForVideo && (
              <button
                type="button"
                onClick={() => onUseForVideo(a.url)}
                title="Use this image for video production"
                className="flex items-center justify-center gap-1 h-8 px-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs font-medium transition-colors"
              >
                <Clapperboard className="w-3.5 h-3.5" /> To Video
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}