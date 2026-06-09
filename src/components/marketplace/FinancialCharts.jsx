import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend, ComposedChart, Line } from "recharts";

function generateProjections(revenue, expenses, growthRate) {
  const monthlyGrowth = (growthRate || 0) / 100;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = [];
  let rev = revenue || 0;
  let exp = expenses || 0;

  for (let i = 0; i < 12; i++) {
    data.push({
      month: months[i],
      revenue: Math.round(rev),
      expenses: Math.round(exp),
      profit: Math.round(rev - exp),
    });
    rev *= (1 + monthlyGrowth);
    exp *= (1 + monthlyGrowth * 0.7); // expenses grow slower
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border/40 rounded-xl p-3 shadow-xl backdrop-blur-xl">
      <p className="text-xs font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function FinancialCharts({ listing, style }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("revenue");

  const revenue = listing.monthlyRevenue || 0;
  const expenses = listing.monthlyExpenses || 0;
  const growthRate = listing.growthRate || 0;
  const data = generateProjections(revenue, expenses, growthRate);

  const monthlyProfit = revenue - expenses;
  const profitMargin = revenue > 0 ? ((monthlyProfit / revenue) * 100).toFixed(1) : 0;
  const annualRevenue = revenue * 12;
  const annualProfit = monthlyProfit * 12;

  const tabs = [
    { key: "revenue", label: "Revenue", icon: DollarSign, color: "#10b981" },
    { key: "profit", label: "Profit", icon: TrendingUp, color: "#f59e0b" },
    { key: "combined", label: "Combined", icon: BarChart3, color: "#8b5cf6" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={style}>
      <Card className="border-emerald-500/10 bg-card/60 backdrop-blur-xl">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-base font-display flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Financial Analytics
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-4 pb-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Annual Revenue</p>
                    <p className="text-lg font-display font-bold text-emerald-400">${annualRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Annual Profit</p>
                    <p className="text-lg font-display font-bold text-amber-400">${annualProfit.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Margin</p>
                    <p className="text-lg font-display font-bold text-blue-400">{profitMargin}%</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Growth</p>
                    <p className="text-lg font-display font-bold text-violet-400">+{growthRate}%</p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={(e) => { e.stopPropagation(); setActiveTab(tab.key); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" style={{ color: activeTab === tab.key ? tab.color : undefined }} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="h-64 sm:h-72 w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full w-full"
                    >
                      {activeTab === "revenue" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data}>
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}

                      {activeTab === "profit" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="profit" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Profit" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {activeTab === "combined" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "11px" }} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
                            <Line type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} name="Profit" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}