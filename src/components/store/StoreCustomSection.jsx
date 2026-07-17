import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap, Headphones } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";

const STORE_DEFAULTS = { title: "Why Buy From Us", subtitle: "Everything you need, all in one place" };

const DEFAULT_BOXES = [
  { icon: ShieldCheck, title: "Secure Checkout", text: "Every purchase is protected with bank-grade encryption." },
  { icon: Zap, title: "Instant Access", text: "Get your deals delivered the moment you buy." },
  { icon: Headphones, title: "Dedicated Support", text: "Our team is here to help you any time you need it." },
];

export default function StoreCustomSection({ boxes, brandColor = "#f97316", styleSlug }) {
  const items = Array.isArray(boxes) && boxes.length > 0 ? boxes : DEFAULT_BOXES;
  const style = getStoreStyle(styleSlug);
  const pal = style.palette;
  const accent = pal?.accent || brandColor;
  const cardClass = pal
    ? `${style.products.radius} p-6 text-center border`
    : `bg-card/60 border border-border/40 ${style.products.radius} p-6 text-center`;
  const cardStyle = pal ? { background: pal.card, borderColor: pal.cardBorder } : undefined;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 ${style.hero.badgePill ? "rounded-full" : "rounded-none"} text-[11px] mb-3 border`}
          style={pal
            ? { background: pal.card, borderColor: pal.cardBorder, color: accent, fontFamily: style.bodyFont }
            : { fontFamily: style.bodyFont }}
        >
          <Sparkles className="w-3 h-3" style={{ color: accent }} /> {STORE_DEFAULTS.subtitle}
        </div>
        <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>{STORE_DEFAULTS.title}</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((b, i) => {
          const Icon = b.icon || Sparkles;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={cardClass} style={cardStyle}>
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${accent}22` }}>
                <Icon className="w-6 h-6" style={{ color: accent }} />
              </div>
              <h3 className={`text-base font-semibold mb-1 ${style.products.uppercaseTitle ? "uppercase tracking-wide" : ""}`} style={{ fontFamily: style.headingFont }}>{b.title}</h3>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: style.bodyFont }}>{b.text}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}