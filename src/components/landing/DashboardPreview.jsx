import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Briefcase, PieChart, DollarSign, TrendingUp, ArrowUpRight, Calendar } from "lucide-react";

const portfolio = [
  { name: "Real Estate CRM", shares: 5, value: 500, revenue: 50, growth: 12.3 },
  { name: "AI Voice Agent", shares: 3, value: 750, revenue: 75, growth: 18.7 },
  { name: "Lead Gen SaaS", shares: 2, value: 600, revenue: 60, growth: 8.4 },
];

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Dashboard</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Investor Dashboard</h2>
          <p className="text-muted-foreground mt-4">Track your portfolio, earnings, and upcoming distributions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Briefcase className="w-4 h-4" />, label: "Owned SaaS", value: "3", color: "text-primary" },
              { icon: <PieChart className="w-4 h-4" />, label: "Total Shares", value: "10", color: "text-violet-400" },
              { icon: <DollarSign className="w-4 h-4" />, label: "Revenue Earned", value: "$1,850", color: "text-emerald-400" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Portfolio Value", value: "$1,850", color: "text-amber-400" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-secondary/40 p-4">
                <div className={`${s.color} mb-2`}>{s.icon}</div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Portfolio Table */}
          <div className="rounded-xl border border-border/30 bg-secondary/30 overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h4 className="font-display font-bold text-sm">Portfolio Holdings</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Next Distribution: June 15
              </div>
            </div>
            <div className="divide-y divide-border/20">
              {portfolio.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.shares} shares</p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-sm font-bold">${p.value}</p>
                    <p className="text-[10px] text-muted-foreground">Value</p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-sm font-bold text-emerald-400">${p.revenue}/mo</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {p.growth}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Resale */}
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-bold">Share Resale Market</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sell your shares to other investors anytime</p>
            </div>
            <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Open Market <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}