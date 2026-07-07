import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, ShoppingBag, UserPlus, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANGES = [
  { id: "day", label: "Days", buckets: 14, unit: "day" },
  { id: "week", label: "Weeks", buckets: 12, unit: "week" },
  { id: "year", label: "Years", buckets: 5, unit: "year" },
];

// Build empty time buckets ending at "now" for the selected range.
function buildBuckets(range) {
  const now = new Date();
  const out = [];
  for (let i = range.buckets - 1; i >= 0; i--) {
    const d = new Date(now);
    let label, start, end;
    if (range.unit === "day") {
      d.setDate(now.getDate() - i);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      end = new Date(start); end.setDate(start.getDate() + 1);
      label = `${start.getDate()}/${start.getMonth() + 1}`;
    } else if (range.unit === "week") {
      d.setDate(now.getDate() - i * 7);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6);
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      label = `${start.getDate()}/${start.getMonth() + 1}`;
    } else {
      const yr = now.getFullYear() - i;
      start = new Date(yr, 0, 1);
      end = new Date(yr + 1, 0, 1);
      label = `${yr}`;
    }
    out.push({ label, start: start.getTime(), end: end.getTime(), sales: 0 });
  }
  return out;
}

export default function SalesAnalytics({ marketplaces = [] }) {
  const [rangeId, setRangeId] = useState("day");
  const [selectedMpId, setSelectedMpId] = useState("all");
  const range = RANGES.find((r) => r.id === rangeId);

  const marketplaceIds = useMemo(() => marketplaces.map((m) => m.id), [marketplaces]);
  const activeIds = selectedMpId === "all" ? marketplaceIds : [selectedMpId];

  // Real store sales come from StoreOrder records created at checkout.
  const { data: orders = [] } = useQuery({
    queryKey: ["analyticsStoreOrders", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.StoreOrder.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["analyticsCustomers", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.StoreCustomer.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
  });

  // Paid orders scoped to the selected marketplace drive revenue.
  const scopedOrders = useMemo(
    () => orders.filter((o) => activeIds.includes(o.marketplaceId) && o.paymentStatus === "paid"),
    [orders, activeIds]
  );
  const scopedCustomers = useMemo(
    () => customers.filter((c) => activeIds.includes(c.marketplaceId)),
    [customers, activeIds]
  );

  // Aggregate sales into time buckets.
  const chartData = useMemo(() => {
    const buckets = buildBuckets(range);
    scopedOrders.forEach((o) => {
      const t = new Date(o.paidAt || o.created_date || o.updated_date || Date.now()).getTime();
      const b = buckets.find((bk) => t >= bk.start && t < bk.end);
      if (b) b.sales += o.total || 0;
    });
    return buckets;
  }, [scopedOrders, range]);

  const totalProfit = useMemo(() => scopedOrders.reduce((s, o) => s + (o.total || 0), 0), [scopedOrders]);
  const totalSold = scopedOrders.length;

  const recentSold = useMemo(
    () => [...scopedOrders]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 5),
    [scopedOrders]
  );
  const recentCustomers = useMemo(
    () => [...scopedCustomers]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 5),
    [scopedCustomers]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" /> Sales Overview
            </h3>
            <p className="text-2xl font-bold mt-1">${totalProfit.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMpId} onValueChange={setSelectedMpId}>
              <SelectTrigger className="w-40 h-9 rounded-xl bg-secondary/50 border-border/30 text-xs">
                <SelectValue placeholder="All marketplaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Marketplaces</SelectItem>
                {marketplaces.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Range toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/40 mb-4">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                rangeId === r.id ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 8% 14%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(25 5% 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(25 5% 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
            <Tooltip
              contentStyle={{ background: "hsl(20 10% 7%)", border: "1px solid hsl(20 8% 14%)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "#fff" }}
              formatter={(v) => [`$${Number(v).toLocaleString()}`, "Sales"]}
            />
            <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2.5} fill="url(#salesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Right side card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-5"
      >
        <div className="rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-500/5 border border-orange-500/20 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="w-3.5 h-3.5" /> Total Profit</div>
          <p className="text-3xl font-bold mt-1">${totalProfit.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{totalSold} sales recorded</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Recent Sold Products
          </p>
          <div className="space-y-2">
            {recentSold.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No sales yet.</p>
            ) : recentSold.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                <span className="truncate max-w-[55%]">{o.items?.[0]?.listingTitle || "Product"}{o.items?.length > 1 ? ` +${o.items.length - 1}` : ""}</span>
                <span className="text-emerald-400 font-medium shrink-0">${(o.total || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Customers Enrolled
          </p>
          <div className="space-y-2">
            {recentCustomers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No customers yet.</p>
            ) : recentCustomers.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 text-sm py-1">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-semibold shrink-0">
                  {(c.fullName || c.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{c.fullName || "Customer"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}