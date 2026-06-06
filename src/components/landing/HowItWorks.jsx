import React from "react";
import { Crown, PieChart, Upload, Code, Globe, Database, Users, DollarSign, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

function GlassCard({ children, className = "" }) {
  return (
    <div className={`relative group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 hover:border-primary/30 transition-all duration-500 ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Choose Your Path to Ownership</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Three powerful ways to participate in the SaaS economy</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Option 1 */}
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
            <GlassCard className="h-full">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Option 1</span>
              <h3 className="text-xl font-display font-bold mt-1 mb-3">Full Ownership</h3>
              <p className="text-sm text-muted-foreground mb-5">Buy the entire SaaS and become the sole owner.</p>

              <div className="rounded-xl bg-secondary/60 border border-border/40 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Real Estate CRM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Verified</span>
                </div>
                <p className="text-2xl font-display font-bold">$5,000</p>
                <div className="space-y-2">
                  {[
                    { icon: <Code className="w-3.5 h-3.5" />, text: "Source Code" },
                    { icon: <Globe className="w-3.5 h-3.5" />, text: "Domain & Branding" },
                    { icon: <Database className="w-3.5 h-3.5" />, text: "Customer Database" },
                    { icon: <DollarSign className="w-3.5 h-3.5" />, text: "Revenue Rights" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-emerald-400">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Option 2 */}
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
            <GlassCard className="h-full border-primary/30">
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary tracking-wider uppercase">Option 2</span>
              <h3 className="text-xl font-display font-bold mt-1 mb-3">Shared Ownership</h3>
              <p className="text-sm text-muted-foreground mb-5">Purchase fractional shares of profitable SaaS.</p>

              <div className="rounded-xl bg-secondary/60 border border-border/40 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Real Estate CRM</span>
                  <span className="text-lg font-display font-bold">$5,000</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50 Shares Available</span>
                  <span className="text-primary font-semibold">$100/share</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ownership Progress</span>
                    <span className="text-primary font-semibold">76%</span>
                  </div>
                  <Progress value={76} className="h-2 bg-secondary" />
                  <p className="text-[10px] text-muted-foreground">38/50 Shares Sold</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  Monthly revenue payouts to shareholders
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Option 3 */}
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
            <GlassCard className="h-full">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-violet-400 tracking-wider uppercase">Option 3</span>
              <h3 className="text-xl font-display font-bold mt-1 mb-3">Sell Your SaaS</h3>
              <p className="text-sm text-muted-foreground mb-5">List your SaaS and choose your selling model.</p>

              <div className="rounded-xl bg-secondary/60 border border-border/40 p-4 space-y-3">
                {[
                  { label: "Full Sale", desc: "Sell entire ownership", color: "text-emerald-400" },
                  { label: "Fractional Sale", desc: "Sell shares to investors", color: "text-primary" },
                  { label: "Revenue Sharing", desc: "Share profits with investors", color: "text-amber-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group/item cursor-pointer">
                    <CheckCircle className={`w-4 h-4 ${item.color}`} />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}