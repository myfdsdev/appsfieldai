import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getYouTubeId } from "@/lib/youtube";
import MinimalYouTubePlayer from "@/components/MinimalYouTubePlayer";

// Shows right after the user logs in. Login sets this flag; we clear it once shown.
const AFTER_LOGIN_KEY = "popup_video_after_login";

export default function PopupVideo() {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      // Only show when the just-logged-in flag is present.
      if (!sessionStorage.getItem(AFTER_LOGIN_KEY)) return;
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const cfg = configs?.[0];
        if (cfg?.popupVideoEnabled && getYouTubeId(cfg.popupVideoUrl)) {
          setConfig(cfg);
          setOpen(true);
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem(AFTER_LOGIN_KEY);
    })();
  }, []);

  if (!open || !config) return null;

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
          <MinimalYouTubePlayer url={config.popupVideoUrl} autoplay />
        </div>
      </div>
    </div>
  );
}