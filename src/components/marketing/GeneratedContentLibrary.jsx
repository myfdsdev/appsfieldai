import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import RecentGallery from "./RecentGallery";

// Shows generated marketing assets in Images / Videos sections.
// - Regular users: all of their own assets across every store.
// - Admins: EVERY user's assets in one mixed feed, each item labeled with the
//   user's name & email (like the marketplaces view for admins).
export default function GeneratedContentLibrary({ ownerId, isAdmin }) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-orange-400" />
          Images <span className="text-muted-foreground font-normal">({images.length})</span>
        </h3>
        <RecentGallery assets={images} loading={false} mediaType="image" />
      </section>

      <section className="border-t border-border/40 pt-8">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <VideoIcon className="w-4 h-4 text-orange-400" />
          Videos <span className="text-muted-foreground font-normal">({videos.length})</span>
        </h3>
        <RecentGallery assets={videos} loading={false} mediaType="video" />
      </section>
    </div>
  );
}