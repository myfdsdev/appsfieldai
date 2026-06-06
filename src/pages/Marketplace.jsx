import React, { useState } from "react";
import { motion } from "framer-motion";
import SaaSCard from "@/components/marketplace/SaaSCard";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";

const listings = [
  { id: 1, name: "Real Estate Agent SaaS", category: "CRM", ownerPrice: 5000, sharePrice: 100, totalShares: 50, sharesSold: 32, monthlyRevenue: 1200, growth: 18, rating: 4.8, riskScore: 4, aiScore: 82, imageGradient: "from-violet-600 to-purple-700", status: "active", auctionEndDate: null },
  { id: 2, name: "CRM Dashboard Pro", category: "CRM", ownerPrice: 12000, sharePrice: 250, totalShares: 48, sharesSold: 20, monthlyRevenue: 2800, growth: 24, rating: 4.9, riskScore: 3, aiScore: 91, imageGradient: "from-cyan-600 to-teal-700", status: "active", auctionEndDate: null },
  { id: 3, name: "AI Content Writer", category: "AI & ML", ownerPrice: 8000, sharePrice: 100, totalShares: 80, sharesSold: 55, monthlyRevenue: 1800, growth: 32, rating: 4.7, riskScore: 5, aiScore: 95, imageGradient: "from-emerald-600 to-green-700", status: "auction", auctionEndDate: "2026-06-13T00:00:00" },
  { id: 4, name: "E-com Analytics Tool", category: "Analytics", ownerPrice: 3500, sharePrice: 50, totalShares: 70, sharesSold: 15, monthlyRevenue: 800, growth: 15, rating: 4.5, riskScore: 6, aiScore: 74, imageGradient: "from-amber-600 to-orange-700", status: "active", auctionEndDate: null },
  { id: 5, name: "Marketing Automator", category: "Marketing", ownerPrice: 6500, sharePrice: 130, totalShares: 50, sharesSold: 40, monthlyRevenue: 1500, growth: 28, rating: 4.6, riskScore: 4, aiScore: 88, imageGradient: "from-rose-600 to-pink-700", status: "auction", auctionEndDate: "2026-06-09T18:00:00" },
  { id: 6, name: "Finance Tracker Pro", category: "Finance", ownerPrice: 4000, sharePrice: 80, totalShares: 50, sharesSold: 10, monthlyRevenue: 900, growth: 20, rating: 4.4, riskScore: 2, aiScore: 79, imageGradient: "from-indigo-600 to-blue-700", status: "active", auctionEndDate: null },
  { id: 7, name: "Project Manager SaaS", category: "Productivity", ownerPrice: 9500, sharePrice: 190, totalShares: 50, sharesSold: 25, monthlyRevenue: 2200, growth: 22, rating: 4.8, riskScore: 3, aiScore: 85, imageGradient: "from-violet-600 to-indigo-700", status: "active", auctionEndDate: null },
  { id: 8, name: "Chatbot Builder AI", category: "AI & ML", ownerPrice: 15000, sharePrice: 300, totalShares: 50, sharesSold: 30, monthlyRevenue: 3500, growth: 40, rating: 4.9, riskScore: 5, aiScore: 96, imageGradient: "from-cyan-600 to-blue-700", status: "auction", auctionEndDate: "2026-06-11T12:00:00" },
];

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [auctionEndingSoon, setAuctionEndingSoon] = useState(false);

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const filtered = listings.filter((l) => {
    const catMatch = selectedCategory === "All" || l.category === selectedCategory;
    const searchMatch = l.name.toLowerCase().includes(search.toLowerCase());
    const revenueMatch = revenueMap[revenueFilter](l.monthlyRevenue);
    const priceMatch = priceMap[priceFilter](l.ownerPrice);
    const riskMatch = riskMap[riskFilter](l.riskScore);
    const auctionMatch = !auctionEndingSoon || (l.status === "auction" && l.auctionEndDate && new Date(l.auctionEndDate).getTime() - now < SEVEN_DAYS);
    return catMatch && searchMatch && revenueMatch && priceMatch && riskMatch && auctionMatch;
  });

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((l, i) => (
          <SaaSCard key={l.id} listing={l} delay={i * 0.05} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-display">No listings found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}