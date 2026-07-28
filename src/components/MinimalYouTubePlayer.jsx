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
function fmt(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MinimalYouTubePlayer({ url, autoplay = true }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoId = getYouTubeId(url);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      // YouTube REPLACES the target node with an iframe. Give it a fresh child
      // div (not the React-managed container) so React's ref stays valid.
      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      containerRef.current.appendChild(mount);
      playerRef.current = new window.YT.Player(mount, {
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
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime && p?.getDuration) {
        setCurrent(p.getCurrentTime() || 0);
        setDuration(p.getDuration() || 0);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearInterval(interval);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [videoId, autoplay]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const seek = (e) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    p.seekTo(Number(e.target.value), true);
    setCurrent(Number(e.target.value));
  };

  if (!videoId) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black flex items-center justify-center" style={{ paddingTop: "56.25%" }}>
        <span className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Invalid video link</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black group mx-auto" style={{ aspectRatio: "16 / 9", maxHeight: "70vh" }}>
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

      {/* Seek bar */}
      {ready && (
        <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-2.5 pt-6 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2">
          <span className="text-[11px] text-white/80 tabular-nums w-9 text-right">{fmt(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={current}
            onChange={seek}
            aria-label="Seek"
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-white bg-white/30"
          />
          <span className="text-[11px] text-white/80 tabular-nums w-9">{fmt(duration)}</span>
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}