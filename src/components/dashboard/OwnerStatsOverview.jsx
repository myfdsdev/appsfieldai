import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, ShoppingBag, Users, DollarSign } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

// Owner-scoped product/sales overview shown at the top of the dashboard.
export default function OwnerStatsOverview({ marketplaces = [] }) {
  const marketplaceIds = useMemo(() => marketplaces.map((m) => m.id), [marketplaces]);

  const { data: listings = [] } = useQuery({
    queryKey: ["ownerListings", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.SaaSListing.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
  });

  const listingIds = useMemo(() => listings.map((l) => l.id), [listings]);

  const { data: purchases = [] } = useQuery({
    queryKey: ["ownerPurchases", listingIds],
    queryFn: async () => {
      const results = await Promise.all(listingIds.map((id) => base44.entities.SharePurchase.filter({ listingId: id })));
      return results.flat();
    },
    enabled: listingIds.length > 0,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["ownerCustomers", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.StoreCustomer.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
  });

  const liveProducts = listings.filter((l) => ["active", "approved", "live"].includes(l.status) || l.dealStatus === "live").length;
  const soldReserved = listings.reduce((sum, l) => sum + (l.soldShares || 0), 0);
  const revenue = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const stats = [
    { icon: Package, label: "Live Products", value: liveProducts, color: "from-violet-600 to-purple-600" },
    { icon: ShoppingBag, label: "Sold / Reserved", value: soldReserved, color: "from-orange-500 to-amber-500" },
    { icon: Users, label: "Customers", value: customers.length, color: "from-cyan-600 to-blue-600" },
    { icon: DollarSign, label: "Revenue", value: `$${revenue.toLocaleString()}`, color: "from-emerald-600 to-green-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i * 0.06} />
      ))}
    </div>
  );
}