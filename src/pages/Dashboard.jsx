import React from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, PieChart, Activity, Wallet, Gavel, BarChart3 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import LiveAuctionsCard from "@/components/dashboard/LiveAuctionsCard";
import InvestmentsTable from "@/components/dashboard/InvestmentsTable";
import AITipCard from "@/components/dashboard/AITipCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingPayouts from "@/components/dashboard/UpcomingPayouts";

const stats = [
  { icon: DollarSign, label: "Total Portfolio Value", value: "$48,250", change: "+12.4%", up: true, color: "from-violet-500 to-purple-500" },
  { icon: PieChart, label: "Total Shares Owned", value: "45", change: null, up: true, color: "from-cyan-500 to-teal-500" },
  { icon: TrendingUp, label: "Monthly Revenue", value: "$2,840", change: "+8.1%", up: true, color: "from-emerald-500 to-green-500" },
  { icon: BarChart3, label: "Total Investments", value: "8", change: null, up: true, color: "from-amber-500 to-orange-500" },
  { icon: Wallet, label: "Available Balance", value: "$5,420", change: "+$500", up: true, color: "from-pink-500 to-rose-500" },
  { icon: Activity, label: "Active Auctions", value: "6", change: "2 ending soon", up: true, color: "from-indigo-500 to-blue-500" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, Alex. Here's your portfolio overview.</p>
      </motion.div>

      {/* Stats Grid - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.06} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PortfolioChart />
        </div>
        <div>
          <RevenueChart />
        </div>
      </div>

      {/* Middle Row - Auctions + Payouts + AI Tip */}
      <div className="grid lg:grid-cols-3 gap-4">
        <LiveAuctionsCard />
        <UpcomingPayouts />
        <AITipCard />
      </div>

      {/* Bottom Row - Investments Table + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <InvestmentsTable />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}