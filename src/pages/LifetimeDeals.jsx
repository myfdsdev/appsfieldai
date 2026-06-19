import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Infinity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SaaSCard from "@/components/marketplace/SaaSCard";
import ReserveSpotModal from "@/components/marketplace/ReserveSpotModal";
import BuySpotModal from "@/components/marketplace/BuySpotModal";
import SaaSDetailModal from "@/components/marketplace/SaaSDetailModal";

export default function LifetimeDeals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewDetailListing, setViewDetailListing] = useState(null);
  const [reserveSpotListing, setReserveSpotListing] = useState(null);
  const [buySpotListing, setBuySpotListing] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["lifetimeDeals"],
    queryFn: () => base44.entities.SaaSListing.filter({ isLifetimeDeal: true }),
  });

  const visible = listings
    .filter(l => ["active", "auction", "sold"].includes(l.status))
    .filter(l => !search || (l.softwareName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Infinity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Lifetime Deals</h1>
          <p className="text-sm text-muted-foreground">Pay once, use forever — exclusive lifetime access deals</p>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search lifetime deals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/60 border-border/40 rounded-xl h-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Infinity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-display">No lifetime deals available</p>
          <p className="text-sm mt-1">New lifetime deals are added regularly — stay tuned!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((l, i) => (
            <SaaSCard key={l.id} listing={l} delay={i * 0.04} onViewDetails={setViewDetailListing} onReserveSpot={setReserveSpotListing} onBuySpot={setBuySpotListing} />
          ))}
        </div>
      )}

      <ReserveSpotModal listing={reserveSpotListing} open={!!reserveSpotListing} onClose={() => setReserveSpotListing(null)} />
      <BuySpotModal listing={buySpotListing} open={!!buySpotListing} onClose={() => setBuySpotListing(null)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["lifetimeDeals"] })} />
      <SaaSDetailModal listingId={viewDetailListing?.id} open={!!viewDetailListing} onClose={() => setViewDetailListing(null)} />
    </div>
  );
}