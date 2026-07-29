import React, { useState } from "react";
import { Download, Video as VideoIcon, Clapperboard, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Force a real file download. The R2 CDN doesn't send CORS headers, so a direct
// client fetch is blocked — we proxy through the backend which streams the file
// with a Content-Disposition: attachment header.
async function downloadAsset(url, mediaType) {
  const filename = `appsfield-${mediaType}-${Date.now()}.${mediaType === "video" ? "mp4" : "png"}`;
  try {
    const res = await base44.functions.invoke(
      "downloadAsset",
      { url, filename },
      { responseType: "blob" }
    );
    // Force the correct MIME type by extension so the saved file previews properly.
    const mime = mediaType === "video" ? "video/mp4" : "image/png";
    const raw = res?.data instanceof Blob ? res.data : new Blob([res.data]);
    const blob = raw.type ? raw : new Blob([raw], { type: mime });
    const typedBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });
    const objUrl = URL.createObjectURL(typedBlob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url.replace(/^http:\/\//, "https://"), "_blank");
    toast.error("Couldn't download directly — opened in a new tab instead.");
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