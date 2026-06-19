import React, { useState } from "react";
import { Gem, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SaaSCard from "@/components/marketplace/SaaSCard";

const STORE_DEFAULTS = { title: "One In A Lifetime Deals", subtitle: "Exclusive lifetime offers from this store" };

export default function OneInALifetimeDeals({ listings = [], onViewDetails }) {
  const [search, setSearch] = useState("");

  const filtered = listings.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (l.softwareName || "").toLowerCase().includes(q)
      || (l.shortDescription || "").toLowerCase().includes(q)
      || (l.category || "").toLowerCase().includes(q);
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{STORE_DEFAULTS.title}</h2>
            <p className="text-xs text-muted-foreground">{STORE_DEFAULTS.subtitle}</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals..." className="bg-secondary/50 border-border/30 rounded-xl pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No deals match "{search}".</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((l, i) => (
            <SaaSCard key={l.id} listing={l} delay={i * 0.04} onViewDetails={onViewDetails} onBuySpot={onViewDetails} onReserveSpot={onViewDetails} />
          ))}
        </div>
      )}
    </section>
  );
}