import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import RecentGallery from "./RecentGallery";

// Shows ALL of the owner's generated marketing assets across every store,
// categorized into Images and Videos sections.
export default function GeneratedContentLibrary({ ownerId }) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ownerId) { setImages([]); setVideos([]); setLoading(false); return; }
      setLoading(true);
      try {
        const rows = await base44.entities.MarketingAsset.filter({ ownerId }, "-created_date", 500);
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
  }, [ownerId]);

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