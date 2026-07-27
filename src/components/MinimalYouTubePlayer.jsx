import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { getYouTubeId } from "@/lib/youtube";

// Loads the YouTube IFrame API once and resolves when ready.
let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev && prev();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

// A clean YouTube player with ONLY play/pause — no YouTube controls, logo,
// related videos, or menus. A transparent overlay swallows all clicks so
// the underlying YouTube UI is never interactive.
export default function MinimalYouTubePlayer({ url, autoplay = true }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const videoId = getYouTubeId(url);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            setReady(true);
            if (autoplay) { e.target.playVideo(); }
          },
          onStateChange: (e) => {
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
    };
  }, [videoId, autoplay]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  if (!videoId) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black flex items-center justify-center" style={{ paddingTop: "56.25%" }}>
        <span className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Invalid video link</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black group" style={{ paddingTop: "56.25%" }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Transparent click layer — captures all clicks so YouTube UI is inert */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none"
      >
        {/* Center play/pause button */}
        <span
          className={`w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm text-white flex items-center justify-center transition-opacity duration-200 ${
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </span>
      </button>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}