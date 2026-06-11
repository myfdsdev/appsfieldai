import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal, LayoutDashboard, LayoutGrid, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SaaSCard from "@/components/marketplace/SaaSCard";
import ReserveSpotModal from "@/components/marketplace/ReserveSpotModal";
import RequestAcquisitionModal from "@/components/marketplace/RequestAcquisitionModal";
import SaaSDetailModal from "@/components/marketplace/SaaSDetailModal";

const CATEGORIES = ["All Categories", "AI & ML", "CRM", "Analytics", "E-commerce", "Marketing", "Productivity", "Finance", "Developer Tools", "Design Tools"];
const SORT_OPTIONS = ["Newest", "Oldest", "Highest Revenue", "Lowest Price", "Highest Price"];

const revenueMap = {
  "All": () => true, "Under $500": (v) => v < 500, "$500-$1,000": (v) => v >= 500 && v < 1000,
  "$1,000-$2,000": (v) => v >= 1000 && v < 2000, "$2,000-$5,000": (v) => v >= 2000 && v < 5000, "$5,000+": (v) => v >= 5000,
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Newest");
  const [gridCols, setGridCols] = useState(4);
  const [viewDetailListing, setViewDetailListing] = useState(null);
  const [reserveSpotListing, setReserveSpotListing] = useState(null);
  const [requestAcqListing, setRequestAcqListing] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["saasListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const publicListings = listings.filter((l) => l.status === "active" || l.status === "auction" || l.status === "sold");

  const filtered = publicListings.filter((l) => {
    const catMatch = selectedCategory === "All Categories" || l.category === selectedCategory;
    const searchMatch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "Newest") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "Oldest") return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === "Highest Revenue") return (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0);
    if (sortBy === "Highest Price") return (b.fullPrice || 0) - (a.fullPrice || 0);
    if (sortBy === "Lowest Price") return (a.fullPrice || 0) - (b.fullPrice || 0);
    return 0;
  });

  const handleBuySuccess = () => queryClient.invalidateQueries({ queryKey: ["saasListings"] });

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 px-4 text-center overflow-hidden rounded-2xl mb-2"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(180,60,10,0.35) 0%, rgba(10,6,3,0) 70%)" }}
      >
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-foreground/70 text-xs font-medium mb-7"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          The Future of SaaS Ownership
        </motion.div>

        {/* Robot mascot */}
        <motion.img
          src="https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png"
          alt="AI mascot"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 200 }}
          className="w-20 h-20 object-contain mx-auto mb-4"
        />

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-5"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Split the Price.</span>{" "}
          <br />
          <span className="text-foreground">Own the </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Software.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8"
        >
          Join group deals on premium software. Lock a slot, split the cost,{" "}
          and save up to <strong className="text-foreground">98% off the full price.</strong>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <button
            onClick={() => document.getElementById("listings-grid")?.scrollIntoView({ behavior: "smooth" })}
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Active deals live now
          </button>
          <button
            onClick={() => navigate("/sell")}
            className="px-6 py-2.5 rounded-full border border-orange-400/40 text-orange-400 text-sm font-semibold hover:bg-orange-400/10 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Sell My SaaS
          </button>

        </motion.div>
      </motion.div>

      {/* Search + Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center px-0 pb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search software deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/60 border-border/40 rounded-xl h-10 text-sm"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 text-sm rounded-xl bg-secondary/60 border-border/40">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[140px] h-10 text-sm rounded-xl bg-secondary/60 border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grid Toggle Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => setGridCols(3)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              gridCols === 3
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridCols(4)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              gridCols === 4
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div id="listings-grid" className={`grid sm:grid-cols-2 gap-4 ${gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
            {sorted.map((l, i) => (
              <SaaSCard
                key={l.id}
                listing={l}
                delay={i * 0.04}
                onViewDetails={setViewDetailListing}
                onReserveSpot={setReserveSpotListing}
                onRequestAcquisition={setRequestAcqListing}
              />
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-display">No listings found</p>
              <p className="text-sm mt-1">Try a different category or search term.</p>
            </div>
          )}
        </>
      )}

      <ReserveSpotModal
        listing={reserveSpotListing}
        open={!!reserveSpotListing}
        onClose={() => setReserveSpotListing(null)}
      />
      <RequestAcquisitionModal
        listing={requestAcqListing}
        open={!!requestAcqListing}
        onClose={() => setRequestAcqListing(null)}
      />
      <SaaSDetailModal
        listingId={viewDetailListing?.id}
        open={!!viewDetailListing}
        onClose={() => setViewDetailListing(null)}
      />
    </div>
  );
}