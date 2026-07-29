import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Video as VideoIcon, Loader2, User as UserIcon } from "lucide-react";
import RecentGallery from "./RecentGallery";

// Shows generated marketing assets.
// - Regular users: all of their own assets across every store.
// - Admins: EVERY user's assets, grouped by user (name + email).
export default function GeneratedContentLibrary({ ownerId, isAdmin }) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const [rows, users] = await Promise.all([
            base44.entities.MarketingAsset.list("-created_date", 1000),
            base44.entities.User.list("-created_date", 1000).catch(() => []),
          ]);
          if (cancelled) return;
          const userById = {};
          users.forEach((u) => { userById[u.id] = u; });
          const byOwner = {};
          rows.forEach((r) => {
            const key = r.ownerId || "unknown";
            if (!byOwner[key]) byOwner[key] = [];
            byOwner[key].push(r);
          });
          const built = Object.entries(byOwner).map(([oid, assets]) => {
            const u = userById[oid];
            return {
              ownerId: oid,
              name: u?.full_name || "Unknown user",
              email: u?.email || "—",
              images: assets.filter((a) => a.mediaType === "image"),
              videos: assets.filter((a) => a.mediaType === "video"),
              total: assets.length,
            };
          }).sort((a, b) => b.total - a.total);
          setGroups(built);
        } else {
          if (!ownerId) { setImages([]); setVideos([]); setLoading(false); return; }
          const rows = await base44.entities.MarketingAsset.filter({ ownerId }, "-created_date", 500);
          if (cancelled) return;
          setImages(rows.filter((r) => r.mediaType === "image"));
          setVideos(rows.filter((r) => r.mediaType === "video"));
        }
      } catch {
        if (!cancelled) { setImages([]); setVideos([]); setGroups([]); }
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

  // ── Admin view: grouped per user ──────────────────────────────
  if (isAdmin) {
    if (!groups.length) {
      return <p className="text-sm text-muted-foreground text-center py-16">No generated content yet.</p>;
    }
    return (
      <div className="space-y-10">
        {groups.map((g) => (
          <div key={g.ownerId} className="rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground truncate">{g.email}</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">{g.total} items</span>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                  Images <span className="text-muted-foreground font-normal">({g.images.length})</span>
                </h4>
                <RecentGallery assets={g.images} loading={false} mediaType="image" />
              </section>
              <section className="border-t border-border/40 pt-5">
                <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <VideoIcon className="w-3.5 h-3.5 text-orange-400" />
                  Videos <span className="text-muted-foreground font-normal">({g.videos.length})</span>
                </h4>
                <RecentGallery assets={g.videos} loading={false} mediaType="video" />
              </section>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Regular user view ─────────────────────────────────────────
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