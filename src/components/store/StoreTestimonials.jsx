import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";

const STORE_DEFAULTS = { title: "What Our Customers Say", subtitle: "Real reviews from real buyers" };

export default function StoreTestimonials({ testimonials = [], reviews = [], brandColor = "#f97316", title, subtitle, styleSlug }) {
  const style = getStoreStyle(styleSlug);
  // Prefer owner-managed testimonials; fall back to approved product reviews.
  const items = (testimonials && testimonials.length > 0)
    ? testimonials.map(t => ({
        id: t.id, rating: t.rating, content: t.content,
        name: t.authorName, role: t.authorRole, avatar: t.authorAvatar,
      }))
    : (reviews || []).map(r => ({
        id: r.id, rating: r.rating, title: r.title, content: r.content,
        name: r.userName, role: r.softwareName ? `on ${r.softwareName}` : "",
      }));

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>{title || STORE_DEFAULTS.title}</h2>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: style.bodyFont }}>{subtitle || STORE_DEFAULTS.subtitle}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 6).map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="bg-card/60 border border-border/40 rounded-2xl p-5 relative">
            <Quote className="w-7 h-7 opacity-10 absolute top-4 right-4" style={{ color: brandColor }} />
            <div className="flex items-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className={`w-3.5 h-3.5 ${idx < (r.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{r.content}</p>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden" style={{ background: brandColor }}>
                {r.avatar ? <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" /> : (r.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium">{r.name || "Anonymous"}</p>
                {r.role && <p className="text-[10px] text-muted-foreground">{r.role}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}