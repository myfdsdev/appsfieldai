import { Search, SlidersHorizontal, LayoutGrid, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["All", "AI & ML", "CRM", "Analytics", "E-commerce", "Marketing", "Productivity", "Finance"];
const revenueRanges = ["All", "Under $500", "$500-$1,000", "$1,000-$2,000", "$2,000-$5,000", "$5,000+"];
const priceRanges = ["All", "Under $1,000", "$1k-$5k", "$5k-$10k", "$10k-$25k", "$25k+"];
const riskLevels = ["All", "Low Risk (1-3)", "Medium Risk (4-6)", "High Risk (7-10)"];

export default function MarketplaceFilters({ 
  search, setSearch, 
  selectedCategory, setSelectedCategory,
  revenueFilter, setRevenueFilter,
  priceFilter, setPriceFilter,
  riskFilter, setRiskFilter,
  auctionEndingSoon, setAuctionEndingSoon,
  sortBy, setSortBy,
  gridCols, setGridCols
}) {
  return (
    <div className="space-y-4">
      {/* Search + Quick Toggles Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search SaaS businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/30 rounded-xl"
          />
        </div>

        <Badge
          variant={auctionEndingSoon ? "default" : "outline"}
          className={`cursor-pointer text-xs rounded-lg px-3 py-1.5 transition-all ${
            auctionEndingSoon
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
              : "border-border/40 hover:border-amber-500/20"
          }`}
          onClick={() => setAuctionEndingSoon(!auctionEndingSoon)}
        >
          Auction Ending Soon
        </Badge>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <Badge
            key={c}
            variant={selectedCategory === c ? "default" : "outline"}
            className={`cursor-pointer text-xs rounded-lg px-3 py-1.5 transition-all ${
              selectedCategory === c
                ? "bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30"
                : "border-border/40 hover:border-violet-500/20"
            }`}
            onClick={() => setSelectedCategory(c)}
          >
            {c}
          </Badge>
        ))}
      </div>

      {/* Filter + Sort + Grid Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        
        <Select value={revenueFilter} onValueChange={setRevenueFilter}>
          <SelectTrigger className="w-[170px] h-8 text-xs rounded-lg bg-secondary/50 border-border/30">
            <SelectValue placeholder="Revenue" />
          </SelectTrigger>
          <SelectContent>
            {revenueRanges.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">{r === "All" ? "All Revenue" : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs rounded-lg bg-secondary/50 border-border/30">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">{p === "All" ? "All Prices" : p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[170px] h-8 text-xs rounded-lg bg-secondary/50 border-border/30">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            {riskLevels.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">{r === "All" ? "All Risk Levels" : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg bg-secondary/50 border-border/30">
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="text-xs">Newest</SelectItem>
            <SelectItem value="price-low" className="text-xs">Price: Low to High</SelectItem>
            <SelectItem value="price-high" className="text-xs">Price: High to Low</SelectItem>
            <SelectItem value="revenue" className="text-xs">Highest Revenue</SelectItem>
            <SelectItem value="growth" className="text-xs">Highest Growth</SelectItem>
          </SelectContent>
        </Select>

        {/* Grid Toggle Buttons */}
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => setGridCols(3)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              gridCols === 3
                ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                : "bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridCols(4)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              gridCols === 4
                ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                : "bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}