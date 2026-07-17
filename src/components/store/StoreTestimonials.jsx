import React from "react";
import { getStoreStyle } from "@/components/store/storeStyles";
import { AuroraLayout, BinaseaLayout, NeonLayout, NitroLayout, CarbonLayout } from "@/components/store/testimonialLayouts";

const STORE_DEFAULTS = { title: "What Our Customers Say", subtitle: "Real reviews from real buyers" };

// Each theme renders its own unique testimonials layout.
const LAYOUTS = {
  aurora: AuroraLayout,
  monolith: BinaseaLayout,
  neon: NeonLayout,
  linen: NitroLayout,
  carbon: CarbonLayout,
};

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

  const Layout = LAYOUTS[style.slug] || AuroraLayout;
  const accent = style.palette?.accent || brandColor;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: accent, fontFamily: style.bodyFont }}>
          {subtitle || STORE_DEFAULTS.subtitle}
        </p>
        <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>{title || STORE_DEFAULTS.title}</h2>
      </div>
      <Layout items={items} style={style} />
    </section>
  );
}