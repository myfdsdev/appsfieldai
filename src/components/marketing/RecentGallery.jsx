import React, { useState } from "react";
import { Download, Video as VideoIcon, Clapperboard, Loader2, Eye, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Force a real file download. The R2 CDN doesn't send CORS headers, so a direct
// client fetch is blocked — we proxy through the backend which streams the file
// with a Content-Disposition: attachment header.
// Map a content-type to a correct file extension so the OS can thumbnail it.
const EXT_BY_MIME = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

async function downloadAsset(url, mediaType) {
  try {
    const res = await base44.functions.invoke("downloadAsset", { url, filename: "download" });
    const data = res?.data || {};
    if (!data.base64) throw new Error("No file data");
    // Decode the base64 payload back into the exact original bytes.
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const mime = data.contentType || (mediaType === "video" ? "video/mp4" : "image/png");
    // Derive the extension from the ACTUAL file type — mismatched extensions
    // (e.g. a .webp saved as .png) break OS thumbnail previews.
    const ext = EXT_BY_MIME[mime.toLowerCase().split(";")[0].trim()] || (mediaType === "video" ? "mp4" : "png");
    const filename = `appsfield-${mediaType}-${Date.now()}.${ext}`;
    const typedBlob = new Blob([bytes], { type: mime });
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

// Centered popup that previews the selected image/video.
function PreviewModal({ asset, onClose }) {
  if (!asset) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {asset.mediaType === "video" ? (
          <video src={asset.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-xl" />
        ) : (
          <img src={asset.url} alt="preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
        )}
      </div>
    </div>
  );
}

// Shows the recent generated assets for the active media type.
export default function RecentGallery({ assets = [], loading, mediaType, onUseForVideo }) {
  const [previewAsset, setPreviewAsset] = useState(null);

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
          <div
            className="relative aspect-square bg-black/20 cursor-pointer group/preview"
            onClick={() => setPreviewAsset(a)}
          >
            {a.mediaType === "video" ? (
              <video src={a.url} className="w-full h-full object-contain" />
            ) : (
              <img src={a.url} alt="generated" className="w-full h-full object-contain" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/preview:bg-black/40 transition-colors">
              <span className="opacity-0 group-hover/preview:opacity-100 flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/90 text-black text-xs font-semibold transition-opacity">
                <Eye className="w-3.5 h-3.5" /> Preview
              </span>
            </div>
          </div>
          {a._ownerLabel && (
            <div className="px-2.5 pt-2">
              <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{a._ownerLabel}</p>
              {a._ownerEmail && <p className="text-[10px] text-muted-foreground truncate">{a._ownerEmail}</p>}
            </div>
          )}
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
      <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
    </div>
  );
}