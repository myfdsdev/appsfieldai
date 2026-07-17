import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";

const answerAnim = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

// Aurora — soft rounded cards, chevron toggle -------------------------------
export function AuroraFAQ({ items, openIndex, setOpenIndex, style }) {
  const pal = style.palette;
  return (
    <div className="space-y-3">
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className="rounded-2xl border overflow-hidden transition-colors" style={{ background: pal.card, borderColor: open ? pal.accent : pal.cardBorder }}>
            <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="text-sm font-medium" style={{ fontFamily: style.headingFont }}>{faq.question}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: open ? pal.accent : undefined }} />
            </button>
            <AnimatePresence initial={false}>
              {open && <motion.div {...answerAnim}><p className="px-5 pb-4 text-sm opacity-75 leading-relaxed" style={{ fontFamily: style.bodyFont }}>{faq.answer}</p></motion.div>}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Binasea (monolith) — pill rows with +/- toggle ----------------------------
export function BinaseaFAQ({ items, openIndex, setOpenIndex, style }) {
  const pal = style.palette;
  return (
    <div className="space-y-3">
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className="rounded-2xl border overflow-hidden" style={{ background: pal.card, borderColor: pal.cardBorder }}>
            <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
              <span className="text-sm sm:text-base font-semibold" style={{ fontFamily: style.headingFont }}>{faq.question}</span>
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: open ? pal.accent : "rgba(255,255,255,0.06)", color: open ? pal.accentText : pal.accent }}>
                {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && <motion.div {...answerAnim}><p className="px-6 pb-5 text-sm opacity-75 leading-relaxed" style={{ fontFamily: style.bodyFont }}>{faq.answer}</p></motion.div>}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Neon — bold left-accent bars, uppercase questions -------------------------
export function NeonFAQ({ items, openIndex, setOpenIndex, style }) {
  const pal = style.palette;
  return (
    <div className="space-y-3">
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className="rounded-xl border-2 overflow-hidden flex" style={{ background: pal.card, borderColor: open ? pal.accent : `${pal.accent}33` }}>
            <div className="w-1.5 shrink-0" style={{ background: open ? pal.accent : "transparent" }} />
            <div className="flex-1">
              <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: style.headingFont, color: open ? pal.accent : undefined }}>{faq.question}</span>
                <Plus className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-45" : ""}`} style={{ color: pal.accent }} />
              </button>
              <AnimatePresence initial={false}>
                {open && <motion.div {...answerAnim}><p className="px-5 pb-4 text-sm opacity-75 leading-relaxed" style={{ fontFamily: style.bodyFont }}>{faq.answer}</p></motion.div>}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Nitro (linen) — minimal underline rows, no boxes --------------------------
export function NitroFAQ({ items, openIndex, setOpenIndex, style }) {
  const pal = style.palette;
  return (
    <div className="divide-y" style={{ borderColor: pal.cardBorder }}>
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{ borderColor: pal.cardBorder }} className="border-b last:border-b-0">
            <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
              <span className="text-base sm:text-lg uppercase tracking-wide" style={{ fontFamily: style.headingFont, color: open ? pal.accent : undefined }}>{faq.question}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: pal.accent }} />
            </button>
            <AnimatePresence initial={false}>
              {open && <motion.div {...answerAnim}><p className="pb-5 text-sm opacity-75 leading-relaxed" style={{ fontFamily: style.bodyFont }}>{faq.answer}</p></motion.div>}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Carbon — sharp structured list, numbered ----------------------------------
export function CarbonFAQ({ items, openIndex, setOpenIndex, style }) {
  const pal = style.palette;
  return (
    <div className="rounded-lg border divide-y overflow-hidden" style={{ background: pal.card, borderColor: pal.cardBorder }}>
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{ borderColor: pal.cardBorder }}>
            <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
              <span className="text-xs font-mono font-semibold w-6 shrink-0" style={{ color: pal.accent }}>{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-sm font-bold" style={{ fontFamily: style.headingFont }}>{faq.question}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: open ? pal.accent : undefined }} />
            </button>
            <AnimatePresence initial={false}>
              {open && <motion.div {...answerAnim}><p className="px-5 pb-4 pl-15 text-sm opacity-75 leading-relaxed" style={{ fontFamily: style.bodyFont }}>{faq.answer}</p></motion.div>}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}