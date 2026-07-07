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

  // Real store sales come from StoreOrder records created at checkout.
  const { data: orders = [] } = useQuery({
    queryKey: ["ownerStoreOrders", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.StoreOrder.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
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
  // Paid store orders drive revenue; total units sold = sum of purchased quantities.
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const unitsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((q, it) => q + (it.quantity || 1), 0), 0);
  const revenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    { icon: Package, label: "Live Products", value: liveProducts, color: "from-violet-600 to-purple-600" },
    { icon: ShoppingBag, label: "Orders Sold", value: unitsSold, color: "from-orange-500 to-amber-500" },
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