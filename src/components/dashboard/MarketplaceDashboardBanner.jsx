import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { buildHeroBackground } from "@/lib/heroBackground";

const CONFIG_KEY = "marketplace_dashboard_banner";

// Hero banner across the top of the Marketplace Dashboard. Title + subtitle come
// from admin config; background uses a cover image when set, else the configured
// gradient/solid. `children` renders the page actions (search + new button) inside.
export default function MarketplaceDashboardBanner({ title, subtitle, children }) {
  const { data: config = null } = useQuery({
    queryKey: ["marketplaceBannerConfig"],
    queryFn: () => base44.entities.AppConfig.filter({ key: CONFIG_KEY }).then(r => r[0] || null),
  });

  const heading = config?.hero_title_line1 || title;
  const sub = config?.hero_subtitle || subtitle;

  const bgStyle = (config?.hero_bg_type === "image" && config?.hero_bg_image_url)
    ? { backgroundImage: `url(${config.hero_bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : config
      ? buildHeroBackground(config)
      : { background: "linear-gradient(to right, #7c3aed, #4c1d95, #0a0603)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/40"
    >
      <div className="absolute inset-0" style={bgStyle} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white drop-shadow">{heading}</h1>
          {sub && <p className="text-sm text-white/80 mt-1 drop-shadow max-w-xl">{sub}</p>}
        </div>
        {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
      </div>
    </motion.div>
  );
}