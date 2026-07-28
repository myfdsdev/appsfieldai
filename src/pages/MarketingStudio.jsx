import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wand2, Image as ImageIcon, Video, Lock, ArrowLeft, Store, Infinity as InfinityIcon, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import StudioPanel from "@/components/marketing/StudioPanel";
import { IMAGE_PRESETS, VIDEO_PRESETS } from "@/components/marketing/marketingPresets";

// Current month key in UTC (matches the backend usage period).
const currentPeriod = () => {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default function MarketingStudio() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [tab, setTab] = useState("image");
  const [storeId, setStoreId] = useState("");
  const [videoSeed, setVideoSeed] = useState(null);

  const { data: userPlan = null, isLoading: planLoading } = useQuery({
    queryKey: ["userPlan", user?.planId],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ id: user.planId }).then((r) => r[0] || null),
    enabled: !!user?.planId,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["ownerMarketplaces", user?.id],
    queryFn: () => base44.entities.Marketplace.filter({ ownerId: user?.id }, "-created_date"),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!storeId && stores.length) setStoreId(stores[0].id);
  }, [stores, storeId]);

  // "Use this image for video production" — switch to the Video tab & seed the ref.
  useEffect(() => {
    const handler = (e) => { setVideoSeed(e.detail); setTab("video"); };
    window.addEventListener("marketing:useForVideo", handler);
    return () => window.removeEventListener("marketing:useForVideo", handler);
  }, []);

  const allowed = isAdmin || userPlan?.marketingStudioAllowed;
  const activeStore = stores.find((s) => s.id === storeId) || null;

  // Usage / limit state for the active tab.
  const hasOwnKey = !!user?.marketingApiKeys?.kieAiApiKey?.trim();
  const usage = user?.marketingUsage || {};
  const usedThisMonth = usage.periodMonth === currentPeriod()
    ? (tab === "image" ? usage.imageCount || 0 : usage.videoCount || 0)
    : 0;
  const planLimit = tab === "image" ? (userPlan?.monthlyImageLimit ?? 0) : (userPlan?.monthlyVideoLimit ?? 0);
  const unlimited = hasOwnKey || isAdmin || planLimit === -1;
  const remaining = Math.max(0, (planLimit || 0) - usedThisMonth);

  if (!user || planLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto"><Lock className="w-7 h-7 text-orange-400" /></div>
        <h1 className="text-xl font-display font-bold">Marketing Studio is a premium feature</h1>
        <p className="text-sm text-muted-foreground">Upgrade to a plan that includes the Stores Marketing Studio to generate AI promotional images and UGC-style videos for your stores.</p>
        <Button asChild className="gap-2"><Link to="/pricing">View Plans</Link></Button>
      </div>
    );
  }

  const tabs = [
    { id: "image", label: "Promotional Images", icon: ImageIcon },
    { id: "video", label: "Promotional Videos", icon: Video },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Stores Marketing Studio</h1>
          <p className="text-sm text-muted-foreground">Generate UGC-style promo images & videos from your store's content.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl shrink-0">
          <Link to="/dashboard"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
        </Button>
      </motion.div>

      {/* Tabs — placed at the top (Lead Finder style) */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/40 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${tab === t.id ? "bg-orange-500 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Usage / limit badge for the active tab */}
      <div className="flex items-center gap-2 flex-wrap -mt-2">
        {unlimited ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <InfinityIcon className="w-3.5 h-3.5" />
            Unlimited {tab === "image" ? "images" : "videos"}{hasOwnKey ? " (your Kie.ai key)" : ""}
          </span>
        ) : (
          <>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${remaining > 0 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
              {remaining} of {planLimit || 0} {tab === "image" ? "images" : "videos"} left this month
            </span>
            <Link to="/my-account?tab=api-keys" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
              <KeyRound className="w-3.5 h-3.5" /> Add your API key for unlimited
            </Link>
          </>
        )}
      </div>

      {/* Store picker */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <Store className="w-4 h-4 text-orange-400" /> Choose Store
        </label>
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">You don't have any stores yet. <Link to="/dashboard" className="text-orange-400 underline">Create one first</Link>.</p>
        ) : (
          <>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              This store's page content is used to write better headlines, descriptions and calls to action.
            </p>
          </>
        )}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "image" && (
          <StudioPanel
            mediaType="image"
            store={activeStore}
            presets={IMAGE_PRESETS}
            presetLabelPrefix="Promotional graphics for software marketing"
          />
        )}
        {tab === "video" && (
          <StudioPanel
            mediaType="video"
            store={activeStore}
            presets={VIDEO_PRESETS}
            presetLabelPrefix="UGC-style promo videos"
            seedImageUrl={videoSeed}
            onSeedConsumed={() => setVideoSeed(null)}
          />
        )}
      </motion.div>
    </div>
  );
}