import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getYouTubeId } from "@/lib/youtube";
import MinimalYouTubePlayer from "@/components/MinimalYouTubePlayer";

// Shows once per browser session — right after login AND on reload.
const SEEN_KEY = "popup_video_seen";

export default function PopupVideo() {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Already shown this session — skip.
    if (sessionStorage.getItem(SEEN_KEY)) return;
    (async () => {
      try {
        // AppConfig may live under key "main" or "config" — grab whichever has the popup fields.
        const configs = await base44.entities.AppConfig.list();
        const cfg =
          configs.find((c) => c.popupVideoEnabled && getYouTubeId(c.popupVideoUrl)) ||
          configs.find((c) => c.key === "main") ||
          configs[0];
        if (cfg?.popupVideoEnabled && getYouTubeId(cfg.popupVideoUrl)) {
          setConfig(cfg);
          setOpen(true);
          sessionStorage.setItem(SEEN_KEY, "1");
        }
      } catch { /* ignore */ }
    })();
  }, []);

  if (!open || !config) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-4xl bg-card rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
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
          <MinimalYouTubePlayer url={config.popupVideoUrl} autoplay />
        </div>
      </div>
    </div>
  );
}