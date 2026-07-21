import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Images, X } from "lucide-react";
import MediaPickerModal from "@/components/marketplace/MediaPickerModal";

// Reusable media field. The "Browse" button opens a media library popup that
// shows the user's recent uploads (Image/Video tabs) plus an upload button.
// You can also paste a URL directly. Keeps the same value/onChange API.
export default function R2ImageUpload({ value, onChange, campaignId = "store-asset", placeholder = "https://example.com/image.png", accept = "image/*" }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isVideo = accept.includes("video");
  const defaultTab = isVideo ? "video" : "image";

  // Detect a YouTube URL and pull its video ID for a thumbnail preview
  const youtubeId = (() => {
    if (!value) return null;
    const m = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  })();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          className="bg-secondary/50 border-border/30 rounded-xl"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-medium hover:bg-orange-500/30 transition-colors"
        >
          <Images className="w-3.5 h-3.5" />
          Browse
        </button>
      </div>
      {value && (
        <div className="relative inline-block">
          {youtubeId ? (
            <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="YouTube preview" className="h-16 rounded-lg border border-border/30 object-cover bg-secondary/30" />
          ) : isVideo ? (
            <video src={value} className="h-16 rounded-lg border border-border/30 object-contain bg-secondary/30" muted />
          ) : (
            <img src={value} alt="preview" className="h-16 rounded-lg border border-border/30 object-contain bg-secondary/30" />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        campaignId={campaignId}
        defaultTab={defaultTab}
      />
    </div>
  );
}