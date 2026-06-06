import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const listings = [
  {
    name: "Real Estate Agent CRM",
    category: "Real Estate",
    monthlyRevenue: 500,
    ownerPrice: 5000,
    sharePrice: 100,
    totalShares: 50,
    sharesLeft: 12,
    badge: "Hot Deal",
    badgeColor: "bg-red-500/20 text-red-400",
  },
  {
    name: "AI Voice Agent",
    category: "AI",
    monthlyRevenue: 1200,
    ownerPrice: 12000,
    sharePrice: 250,
    totalShares: 48,
    sharesLeft: 15,
    badge: "Trending",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    name: "Social Media Automation",
    category: "Marketing",
    monthlyRevenue: 800,
    ownerPrice: 8000,
    sharePrice: 160,
    totalShares: 50,
    sharesLeft: 22,
    badge: "Verified",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
  {
    name: "Lead Generation SaaS",
    category: "Business",
    monthlyRevenue: 1500,
    ownerPrice: 15000,
    sharePrice: 300,
    totalShares: 50,
    sharesLeft: 8,
    badge: "Almost Sold",
    badgeColor: "bg-amber-500/20 text-amber-400",
  },
];

function SaaSCard({ item, index }) {
  const sold = item.totalShares - item.sharesLeft;
  const progress = (sold / item.totalShares) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-primary/30 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg">{item.name}</h3>
            <Badge variant="outline" className="mt-1 text-[10px] border-border/50 text-muted-foreground">
              {item.category}
            </Badge>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${item.badgeColor}`}>
            {item.badge}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-muted-foreground">Monthly Revenue:</span>
          <span className="text-sm font-bold text-emerald-400">${item.monthlyRevenue.toLocaleString()}/mo</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-secondary/60 border border-border/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Owner Price</p>
            <p className="text-lg font-display font-bold">${item.ownerPrice.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-secondary/60 border border-border/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Share Price</p>
            <p className="text-lg font-display font-bold text-primary">${item.sharePrice}</p>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{sold}/{item.totalShares} Shares Sold</span>
            <span className="text-primary font-semibold">{item.sharesLeft} left</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold h-11">
            <DollarSign className="w-4 h-4 mr-1" />
            Buy Full – ${item.ownerPrice.toLocaleString()}
          </Button>
          <Button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-semibold h-11">
            Buy Share – ${item.sharePrice}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketplaceSection() {
  return (
    <section id="marketplace" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Featured Listings</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">SaaS Marketplace</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Own It or Share It — Premium SaaS businesses ready for acquisition</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {listings.map((item, i) => (
            <SaaSCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}