import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";
import { AuroraFAQ, BinaseaFAQ, NeonFAQ, NitroFAQ, CarbonFAQ } from "@/components/store/faqLayouts";

// Each theme renders its own unique FAQ layout.
const LAYOUTS = {
  aurora: AuroraFAQ,
  monolith: BinaseaFAQ,
  neon: NeonFAQ,
  linen: NitroFAQ,
  carbon: CarbonFAQ,
};

// Click-to-open FAQ accordion shown below the store footer.
export default function StoreFAQ({ faqs = [], title, brandColor = "#f97316", styleSlug }) {
  const [openIndex, setOpenIndex] = useState(null);
  const style = getStoreStyle(styleSlug);
  const items = (faqs || []).filter((f) => f?.question && f?.answer);
  if (items.length === 0) return null;

  const Layout = LAYOUTS[style.slug] || AuroraFAQ;
  const accent = style.palette?.accent || brandColor;

  return (
    <section id="store-faq" className="border-t border-border/40">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground mb-3">
            <HelpCircle className="w-3.5 h-3.5" style={{ color: accent }} /> FAQ
          </span>
          <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>{title || "Frequently Asked Questions"}</h2>
        </div>

        <Layout items={items} openIndex={openIndex} setOpenIndex={setOpenIndex} style={style} />
      </div>
    </section>
  );
}