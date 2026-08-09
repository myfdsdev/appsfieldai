import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Package } from "lucide-react";

// Pick which of the store's products a subscription plan unlocks.
// Empty selection = all store products (up to the plan's product limit).
export default function PlanProductPicker({ marketplaceId, value = [], onChange }) {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["storeListingsForPlans", marketplaceId],
    queryFn: () => base44.entities.SaaSListing.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
  });

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (isLoading) return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 py-6 text-center text-muted-foreground text-xs">
        <Package className="w-6 h-6 mx-auto mb-1 opacity-30" /> No products in this store yet.
      </div>
    );
  }

  return (
    <div className="max-h-56 overflow-y-auto rounded-xl border border-border/30 divide-y divide-border/20">
      {listings.map((l) => (
        <label key={l.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/40">
          <input type="checkbox" checked={value.includes(l.id)} onChange={() => toggle(l.id)} className="accent-orange-500 w-4 h-4" />
          {l.logo ? <img src={l.logo} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <div className="w-7 h-7 rounded-lg bg-secondary" />}
          <div className="min-w-0">
            <p className="text-sm truncate">{l.softwareName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{l.category || "—"}</p>
          </div>
        </label>
      ))}
    </div>
  );
}