import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import RecentGallery from "./RecentGallery";

// Shows generated marketing assets under Images / Videos sub-tabs.
// - Regular users: all of their own assets across every store.
// - Admins: EVERY user's assets in one mixed feed, each item labeled with the
//   user's name & email (like the marketplaces view for admins).
export default function GeneratedContentLibrary({ ownerId, isAdmin }) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState("image");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let rows;
        if (isAdmin) {
          const [assets, users] = await Promise.all([
            base44.entities.MarketingAsset.list("-created_date", 1000),
            base44.entities.User.list("-created_date", 1000).catch(() => []),
          ]);
          const userById = {};
          users.forEach((u) => { userById[u.id] = u; });
          rows = assets.map((a) => {
            const u = userById[a.ownerId];
            return { ...a, _ownerLabel: u?.full_name || "Unknown user", _ownerEmail: u?.email || "" };
          });
        } else {
          if (!ownerId) { setImages([]); setVideos([]); setLoading(false); return; }
          rows = await base44.entities.MarketingAsset.filter({ ownerId }, "-created_date", 500);
        }
        if (cancelled) return;
        setImages(rows.filter((r) => r.mediaType === "image"));
        setVideos(rows.filter((r) => r.mediaType === "video"));
      } catch {
        if (!cancelled) { setImages([]); setVideos([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerId, isAdmin]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const subTabs = [
    { id: "image", label: "Images", icon: ImageIcon, count: images.length },
    { id: "video", label: "Videos", icon: VideoIcon, count: videos.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/40 w-fit">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${sub === t.id ? "bg-orange-500 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            <span className={sub === t.id ? "text-white/80" : "text-muted-foreground/70"}>({t.count})</span>
          </button>
        ))}
      </div>

      {sub === "image" ? (
        <RecentGallery assets={images} loading={false} mediaType="image" />
      ) : (
        <RecentGallery assets={videos} loading={false} mediaType="video" />
      )}
    </div>
  );
}