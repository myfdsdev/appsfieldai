import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Grid3X3, Search, ChevronRight, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const CATEGORY_ICONS = {
  "AI & ML": "🤖", "CRM": "📇", "Analytics": "📊", "E-commerce": "🛒",
  "Marketing": "📣", "Productivity": "⚡", "Finance": "💰", "Developer Tools": "🛠️",
  "Design Tools": "🎨", "Communication": "💬", "Security": "🔒", "HR": "👥",
};

export default function Categories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["allListingsForCategories"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const activeListings = listings.filter(l => ["active", "auction"].includes(l.status));

  const categoryMap = {};
  activeListings.forEach(l => {
    const cat = l.category || "Other";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(l);
  });

  const categories = Object.entries(categoryMap)
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => b.count - a.count)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Grid3X3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Browse deals by software category</p>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/60 border-border/40 rounded-xl h-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-display">No categories found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/marketplace?category=${encodeURIComponent(cat.name)}`)}
              className="group flex items-center gap-4 p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-2xl shrink-0">
                {CATEGORY_ICONS[cat.name] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.count} active deal{cat.count !== 1 ? "s" : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 transition-colors shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}