import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SaaSCard from "@/components/marketplace/SaaSCard";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import BuyShareModal from "@/components/marketplace/BuyShareModal";
import FullOwnershipModal from "@/components/marketplace/FullOwnershipModal";

const revenueMap = {
  "All": () => true, "Under $500": (v) => v < 500, "$500-$1,000": (v) => v >= 500 && v < 1000,
  "$1,000-$2,000": (v) => v >= 1000 && v < 2000, "$2,000-$5,000": (v) => v >= 2000 && v < 5000, "$5,000+": (v) => v >= 5000,
};
const priceMap = {
  "All": () => true, "Under $1,000": (v) => v < 1000, "$1k-$5k": (v) => v >= 1000 && v < 5000,
  "$5k-$10k": (v) => v >= 5000 && v < 10000, "$10k-$25k": (v) => v >= 10000 && v < 25000, "$25k+": (v) => v >= 25000,
};
const riskMap = {
  "All": () => true, "Low Risk (1-3)": (v) => v <= 3, "Medium Risk (4-6)": (v) => v >= 4 && v <= 6, "High Risk (7-10)": (v) => v >= 7,
};

export default function Marketplace() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [auctionEndingSoon, setAuctionEndingSoon] = useState(false);
  const [buyShareListing, setBuyShareListing] = useState(null);
  const [buyFullListing, setBuyFullListing] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["saasListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const filtered = listings.filter((l) => {
    const catMatch = selectedCategory === "All" || l.category === selectedCategory;
    const searchMatch = l.title.toLowerCase().includes(search.toLowerCase());
    const revenueMatch = revenueMap[revenueFilter](l.monthlyRevenue);
    const priceMatch = priceMap[priceFilter](l.fullPrice);
    const riskMatch = riskMap[riskFilter](l.riskScore);
    const auctionMatch = !auctionEndingSoon || (l.status === "auction" && l.auctionEndsAt && new Date(l.auctionEndsAt).getTime() - now < SEVEN_DAYS);
    return catMatch && searchMatch && revenueMatch && priceMatch && riskMatch && auctionMatch;
  });

  const handleBuySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["saasListings"] });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">SaaS Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover premium SaaS businesses for full ownership or fractional investment.</p>
      </motion.div>

      <MarketplaceFilters
        search={search} setSearch={setSearch}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        revenueFilter={revenueFilter} setRevenueFilter={setRevenueFilter}
        priceFilter={priceFilter} setPriceFilter={setPriceFilter}
        riskFilter={riskFilter} setRiskFilter={setRiskFilter}
        auctionEndingSoon={auctionEndingSoon} setAuctionEndingSoon={setAuctionEndingSoon}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((l, i) => (
              <SaaSCard key={l.id} listing={l} delay={i * 0.05} onBuyShare={setBuyShareListing} onBuyFullOwnership={setBuyFullListing} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-display">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </>
      )}

      <BuyShareModal
        listing={buyShareListing}
        open={!!buyShareListing}
        onClose={() => setBuyShareListing(null)}
        onSuccess={handleBuySuccess}
      />
      <FullOwnershipModal
        listing={buyFullListing}
        open={!!buyFullListing}
        onClose={() => setBuyFullListing(null)}
        onSuccess={handleBuySuccess}
      />
    </div>
  );
}