import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.4 }}
      className="relative mt-12 lg:mt-0"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl" />
      <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 space-y-4 shadow-2xl shadow-primary/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Real Estate CRM</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">LIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DashCard label="SaaS Value" value="$5,000" icon={<DollarSign className="w-4 h-4" />} color="text-primary" />
          <DashCard label="Owner Price" value="$5,000" icon={<TrendingUp className="w-4 h-4" />} color="text-emerald-400" />
          <DashCard label="Share Price" value="$100" icon={<BarChart3 className="w-4 h-4" />} color="text-violet-400" />
          <DashCard label="Investors" value="38" icon={<Users className="w-4 h-4" />} color="text-amber-400" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Revenue Growth</span>
            <span className="text-emerald-400 font-semibold">+24.5%</span>
          </div>
          <div className="flex gap-1 items-end h-12">
            {[35, 45, 40, 55, 50, 65, 60, 75, 70, 85, 80, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
                className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/80"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DashCard({ label, value, icon, color }) {
  return (
    <div className="rounded-xl border border-border/40 bg-secondary/50 p-3">
      <div className={`${color} mb-1`}>{icon}</div>
      <p className="text-lg font-bold font-display">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">The Future of SaaS Ownership</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
              Own A SaaS.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-violet-400">
                Or Own A Piece Of One.
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Buy complete ownership of profitable SaaS businesses or invest in fractional ownership shares starting from just <span className="text-foreground font-semibold">$100</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-semibold text-base group">
                Explore SaaS Deals
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 border-border/60 text-foreground hover:bg-secondary font-semibold text-base">
                Submit Your SaaS
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-10">
              <Stat value="$2.4M+" label="Revenue Distributed" />
              <div className="w-px h-8 bg-border/50" />
              <Stat value="1,200+" label="Active Investors" />
              <div className="w-px h-8 bg-border/50 hidden sm:block" />
              <div className="hidden sm:block"><Stat value="85+" label="SaaS Listed" /></div>
            </div>
          </motion.div>

          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-xl font-display font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}