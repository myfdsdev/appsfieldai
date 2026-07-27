import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Extract a YouTube video ID from any common YouTube URL format.
function getYouTubeId(url) {
  if (!url) return "";
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : "";
}

const SEEN_KEY = "popup_video_seen";

export default function PopupVideo() {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const cfg = configs?.[0];
        if (cfg?.popupVideoEnabled && getYouTubeId(cfg.popupVideoUrl)) {
          setConfig(cfg);
          // Show once per browser session
          if (!sessionStorage.getItem(SEEN_KEY)) {
            setOpen(true);
            sessionStorage.setItem(SEEN_KEY, "1");
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  if (!open || !config) return null;

  const videoId = getYouTubeId(config.popupVideoUrl);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {config.popupVideoTitle && (
          <div className="px-5 pt-5">
            <h2 className="text-lg font-semibold text-foreground">{config.popupVideoTitle}</h2>
          </div>
        )}
        <div className="p-5">
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={config.popupVideoTitle || "Welcome video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}