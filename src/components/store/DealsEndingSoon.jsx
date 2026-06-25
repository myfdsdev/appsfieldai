import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import SaaSCard from "@/components/marketplace/SaaSCard";

const STORE_DEFAULTS = { title: "Deals Ending Soon 🔥", subtitle: "Grab these before the timer runs out" };

function CountdownPill({ endDate }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return <span className="text-[10px] text-red-400 font-medium">Ended</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const urgent = d < 1;
  return (
    <div className={`flex items-center gap-1 text-[11px] font-semibold ${urgent ? "text-red-400" : "text-amber-400"}`}>
      <Clock className="w-3 h-3" />
      {d > 0 && <span>{d}d</span>}
      <span>{String(h).padStart(2, "0")}h</span>
      <span>{String(m).padStart(2, "0")}m</span>
      <span>{String(s).padStart(2, "0")}s</span>
    </div>
  );
}

export default function DealsEndingSoon({ listings = [], onViewDetails, onReserveSpot, onAddToCart, onBuyNow }) {
  const scrollRef = useRef(null);

  // Deals with an upcoming end date, soonest first, max 6.
  const deals = listings
    .filter(l => !l.noDayLimit && l.dealEndDate && new Date(l.dealEndDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.dealEndDate) - new Date(b.dealEndDate))
    .slice(0, 6);

  if (deals.length === 0) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{STORE_DEFAULTS.title}</h2>
            <p className="text-xs text-muted-foreground">{STORE_DEFAULTS.subtitle}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-secondary/50"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-secondary/50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
        {deals.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="snap-start shrink-0 w-[280px]">
            <div className="relative">
              <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-border/40">
                <CountdownPill endDate={l.dealEndDate} />
              </div>
              <SaaSCard listing={l} delay={0} onViewDetails={onViewDetails} onBuySpot={onViewDetails} onReserveSpot={onReserveSpot || onViewDetails} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}