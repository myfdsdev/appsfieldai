import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { getStoreStyle } from "@/components/store/storeStyles";

// Click-to-open FAQ accordion shown below the store footer.
export default function StoreFAQ({ faqs = [], title, brandColor = "#f97316", styleSlug }) {
  const [openIndex, setOpenIndex] = useState(null);
  const style = getStoreStyle(styleSlug);
  const items = (faqs || []).filter((f) => f?.question && f?.answer);
  if (items.length === 0) return null;

  return (
    <section id="store-faq" className="border-t border-border/40">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground mb-3">
            <HelpCircle className="w-3.5 h-3.5" style={{ color: brandColor }} /> FAQ
          </span>
          <h2 className={style.sectionTitleClass} style={{ fontFamily: style.headingFont }}>{title || "Frequently Asked Questions"}</h2>
        </div>

        <div className="space-y-3">
          {items.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors overflow-hidden ${open ? "border-border bg-card/60" : "border-border/40 bg-card/30"}`}
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    style={open ? { color: brandColor } : undefined}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}