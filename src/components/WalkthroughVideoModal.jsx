import React from "react";
import { X } from "lucide-react";
import MinimalYouTubePlayer from "@/components/MinimalYouTubePlayer";

// Shared modal that plays the configured walkthrough/popup video.
export default function WalkthroughVideoModal({ open, onClose, url, title }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-card rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {title && (
          <div className="px-5 pt-5">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
        )}
        <div className="p-5">
          <MinimalYouTubePlayer url={url} autoplay />
        </div>
      </div>
    </div>
  );
}