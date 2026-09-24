import React, { useState } from "react";
import { Play } from "lucide-react";

const VIDEO_RE = /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i;

function classify(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { type: "embed", url: `https://www.youtube.com/embed/${yt[1]}?rel=0&playsinline=1`, thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "embed", url: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (VIDEO_RE.test(url)) return { type: "video", url };
  return { type: "image", url, thumb: url };
}

// Main media viewer (demo video first, then screenshots) with a thumbnail strip.
export default function SalesGallery({ listing, cardStyle }) {
  const media = [listing.demoVideoUrl, ...(listing.screenshots || [])].filter(Boolean).map(classify);
  const [idx, setIdx] = useState(0);
  const active = media[idx];

  return (
    <div className="space-y-3">
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border/40" style={cardStyle}>
        {!active ? (
          <div className={`w-full h-full bg-gradient-to-br ${listing.imageGradient || "from-orange-500 to-amber-500"} flex items-center justify-center`}>
            {listing.logo
              ? <img src={listing.logo} alt={listing.softwareName} className="max-h-24 max-w-[50%] object-contain" />
              : <span className="text-white text-5xl font-display font-bold">{(listing.softwareName || "?")[0]}</span>}
          </div>
        ) : active.type === "embed" ? (
          <iframe src={active.url} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : active.type === "video" ? (
          <video src={active.url} controls playsInline className="w-full h-full object-contain bg-black" />
        ) : (
          <img src={active.url} alt={listing.softwareName} className="w-full h-full object-cover" />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {media.map((m, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`relative w-24 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-opacity ${i === idx ? "opacity-100" : "opacity-60 hover:opacity-100 border-transparent"}`}
              style={i === idx ? { borderColor: "var(--sp-accent)" } : undefined}>
              {m.thumb ? <img src={m.thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black" />}
              {m.type !== "image" && <Play className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}