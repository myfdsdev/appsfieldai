import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronUp, ChevronDown } from "lucide-react";

// Shared bits ---------------------------------------------------------------
const Stars = ({ rating, accent }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-3.5 h-3.5" style={i < (rating || 0) ? { color: accent, fill: accent } : { color: "rgba(128,128,128,0.3)" }} />
    ))}
  </div>
);

const Avatar = ({ item, accent, accentText, className = "w-8 h-8 text-xs" }) => (
  <div className={`${className} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0`} style={{ background: accent, color: accentText || "#fff" }}>
    {item.avatar ? <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" /> : (item.name || "?")[0].toUpperCase()}
  </div>
);

const fade = (i) => ({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.06 } });

// Aurora — glassy 3-col cards with a gradient top edge ------------------------
export function AuroraLayout({ items, style }) {
  const pal = style.palette;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.slice(0, 6).map((r, i) => (
        <motion.div key={r.id} {...fade(i)} className="rounded-2xl overflow-hidden border" style={{ background: pal.card, borderColor: pal.cardBorder }}>
          <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${pal.accent}, transparent)` }} />
          <div className="p-5">
            <Stars rating={r.rating} accent={pal.accent} />
            {r.title && <p className="text-sm font-semibold mt-3 mb-1" style={{ fontFamily: style.headingFont }}>{r.title}</p>}
            <p className="text-sm opacity-75 leading-relaxed line-clamp-4 mt-3" style={{ fontFamily: style.bodyFont }}>{r.content}</p>
            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t" style={{ borderColor: pal.cardBorder }}>
              <Avatar item={r} accent={pal.accent} accentText={pal.accentText} />
              <div>
                <p className="text-xs font-medium">{r.name || "Anonymous"}</p>
                {r.role && <p className="text-[10px] opacity-60">{r.role}</p>}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Binasea (monolith) — centered avatar-top creator cards, 4-up ----------------
export function BinaseaLayout({ items, style }) {
  const pal = style.palette;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.slice(0, 8).map((r, i) => (
        <motion.div key={r.id} {...fade(i)} className="rounded-2xl border p-5 text-center transition-transform hover:-translate-y-1" style={{ background: pal.card, borderColor: pal.cardBorder }}>
          <div className="mx-auto w-fit rounded-full p-[3px] mb-3" style={{ background: `linear-gradient(135deg, ${pal.accent}, transparent)` }}>
            <Avatar item={r} accent={pal.accent} accentText={pal.accentText} className="w-14 h-14 text-lg" />
          </div>
          <p className="text-sm font-bold" style={{ fontFamily: style.headingFont }}>{r.name || "Anonymous"}</p>
          {r.role && <p className="text-[10px] opacity-60 mb-2">{r.role}</p>}
          <p className="text-xs opacity-75 leading-relaxed line-clamp-4 mt-2" style={{ fontFamily: style.bodyFont }}>{r.content}</p>
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full border" style={{ borderColor: pal.cardBorder, background: "rgba(255,255,255,0.03)" }}>
            <Stars rating={r.rating} accent={pal.accent} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Neon — bold 2-col slabs, thick accent border, giant quote mark --------------
export function NeonLayout({ items, style }) {
  const pal = style.palette;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.slice(0, 4).map((r, i) => (
        <motion.div key={r.id} {...fade(i)} className="relative rounded-xl border-2 p-6 overflow-hidden" style={{ background: pal.card, borderColor: `${pal.accent}44` }}>
          <Quote className="absolute -top-2 -right-2 w-20 h-20 opacity-10 rotate-12" style={{ color: pal.accent }} />
          <p className="text-base sm:text-lg font-light leading-snug line-clamp-4" style={{ fontFamily: style.bodyFont }}>
            "{r.content}"
          </p>
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2.5">
              <Avatar item={r} accent={pal.accent} accentText={pal.accentText} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: pal.accent }}>{r.name || "Anonymous"}</p>
                {r.role && <p className="text-[10px] opacity-60">{r.role}</p>}
              </div>
            </div>
            <Stars rating={r.rating} accent={pal.accent} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Nitro (linen) — one big spotlight quote + small supporting cards ------------
export function NitroLayout({ items, style }) {
  const pal = style.palette;
  const [featured, ...rest] = items;
  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="max-w-3xl mx-auto text-center rounded-2xl border px-6 py-10" style={{ background: pal.card, borderColor: pal.cardBorder }}>
        <div className="flex justify-center mb-4"><Stars rating={featured.rating} accent={pal.accent} /></div>
        <p className="text-xl sm:text-2xl font-light leading-snug" style={{ fontFamily: style.bodyFont }}>
          "{featured.content}"
        </p>
        <div className="flex items-center justify-center gap-2.5 mt-6">
          <Avatar item={featured} accent={pal.accent} accentText={pal.accentText} />
          <div className="text-left">
            <p className="text-xs font-semibold" style={{ color: pal.accent }}>{featured.name || "Anonymous"}</p>
            {featured.role && <p className="text-[10px] opacity-60">{featured.role}</p>}
          </div>
        </div>
      </motion.div>
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {rest.slice(0, 3).map((r, i) => (
            <motion.div key={r.id} {...fade(i + 1)} className="rounded-2xl border p-4" style={{ background: pal.card, borderColor: pal.cardBorder }}>
              <Stars rating={r.rating} accent={pal.accent} />
              <p className="text-xs opacity-75 leading-relaxed line-clamp-3 mt-2.5" style={{ fontFamily: style.bodyFont }}>{r.content}</p>
              <p className="text-[11px] font-semibold mt-3 uppercase tracking-wide" style={{ color: pal.accent }}>{r.name || "Anonymous"}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Nexus — clean light 3-col white cards: gold stars, big quote glyph, italic
// quote, avatar + name/role. Matches the productized-services reference.
export function NexusLayout({ items, style }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.slice(0, 6).map((r, i) => (
        <motion.div
          key={r.id}
          {...fade(i)}
          className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 overflow-hidden"
        >
          <span className="absolute top-4 right-5 font-serif text-6xl leading-none select-none" style={{ color: "#7c3aed", opacity: 0.12 }}>
            &rdquo;
          </span>
          <div className="flex items-center gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, s) => (
              <Star key={s} className="w-4 h-4" style={s < (r.rating || 0) ? { color: "#facc15", fill: "#facc15" } : { color: "rgba(0,0,0,0.12)" }} />
            ))}
          </div>
          <p className="text-[15px] italic text-slate-600 leading-relaxed mb-6" style={{ fontFamily: style.bodyFont }}>
            {r.content}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white" style={{ background: "#7c3aed" }}>
              {r.avatar ? <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" /> : (r.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{r.name || "Anonymous"}</p>
              {r.role && <p className="text-xs text-slate-400">{r.role}</p>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Carbon — vertical slider: active card centered & full, neighbors half-visible
export function CarbonLayout({ items, style }) {
  const pal = style.palette;
  const [active, setActive] = useState(0);
  const timer = useRef(null);
  const total = items.length;

  const go = (dir) => setActive((a) => (a + dir + total) % total);

  // Auto-advance every 5s; pause on hover.
  useEffect(() => {
    if (total <= 1) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % total), 5000);
    return () => clearInterval(timer.current);
  }, [total]);

  const pause = () => clearInterval(timer.current);
  const resume = () => {
    if (total <= 1) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % total), 5000);
  };

  const Card = ({ r }) => (
    <div className="flex gap-4 rounded-lg border p-5 w-full" style={{ background: pal.card, borderColor: pal.cardBorder }}>
      <div className="w-1 rounded-full shrink-0 self-stretch" style={{ background: pal.accent }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar item={r} accent={pal.accent} accentText={pal.accentText} className="w-7 h-7 text-[10px]" />
            <p className="text-sm font-bold truncate" style={{ fontFamily: style.headingFont }}>{r.name || "Anonymous"}{r.role ? <span className="font-normal opacity-60 text-xs"> — {r.role}</span> : null}</p>
          </div>
          <Stars rating={r.rating} accent={pal.accent} />
        </div>
        <p className="text-sm opacity-75 leading-relaxed line-clamp-3" style={{ fontFamily: style.bodyFont }}>{r.content}</p>
      </div>
    </div>
  );

  const prev = (active - 1 + total) % total;
  const next = (active + 1) % total;

  return (
    <div className="max-w-3xl mx-auto flex items-center gap-4" onMouseEnter={pause} onMouseLeave={resume}>
      <div className="relative flex-1 h-[220px] overflow-hidden">
        {/* Prev — top, half-visible & dimmed */}
        {total > 1 && (
          <div className="absolute -top-2 inset-x-0 opacity-30 scale-[0.94] blur-[0.5px] pointer-events-none" style={{ transform: "translateY(-42%)" }}>
            <Card r={items[prev]} />
          </div>
        )}
        {/* Active — centered & full */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            <motion.div key={items[active].id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
              <Card r={items[active]} />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Next — bottom, half-visible & dimmed */}
        {total > 2 && (
          <div className="absolute -bottom-2 inset-x-0 opacity-30 scale-[0.94] blur-[0.5px] pointer-events-none" style={{ transform: "translateY(42%)" }}>
            <Card r={items[next]} />
          </div>
        )}
      </div>

      {/* Vertical controls */}
      {total > 1 && (
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => go(-1)} className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors" style={{ borderColor: pal.cardBorder, color: pal.accent }}>
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => go(1)} className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors" style={{ borderColor: pal.cardBorder, color: pal.accent }}>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}