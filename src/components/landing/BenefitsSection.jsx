import React from "react";
import { motion } from "framer-motion";
import { Gem, CircleDollarSign, TrendingUp, LayoutGrid, Zap, Wallet, Shield } from "lucide-react";

const investorBenefits = [
  { icon: <Gem className="w-5 h-5" />, title: "Own Digital Assets", desc: "Buy real SaaS products instead of speculative investments.", color: "text-primary" },
  { icon: <CircleDollarSign className="w-5 h-5" />, title: "Low Entry Cost", desc: "Start with as little as $100.", color: "text-emerald-400" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Revenue Sharing", desc: "Earn from SaaS profits monthly.", color: "text-violet-400" },
  { icon: <LayoutGrid className="w-5 h-5" />, title: "Portfolio Diversification", desc: "Own multiple SaaS businesses.", color: "text-amber-400" },
];

const sellerBenefits = [
  { icon: <Zap className="w-5 h-5" />, title: "Instant Liquidity", desc: "Sell your SaaS faster than ever.", color: "text-rose-400" },
  { icon: <Wallet className="w-5 h-5" />, title: "Raise Capital", desc: "Fractional ownership helps fund growth.", color: "text-cyan-400" },
  { icon: <Shield className="w-5 h-5" />, title: "Keep Partial Ownership", desc: "Sell shares without losing full control.", color: "text-orange-400" },
];

function BenefitCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl p-5 hover:border-primary/20 transition-all duration-300"
    >
      <div className={`${item.color} w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center mb-3`}>
        {item.icon}
      </div>
      <h4 className="font-display font-bold text-sm mb-1">{item.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
    </motion.div>
  );
}

export default function BenefitsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-violet-500/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">For Investors</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mt-3 mb-8">Why Investors Love It</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {investorBenefits.map((item, i) => <BenefitCard key={i} item={item} index={i} />)}
            </div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">For Sellers</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mt-3 mb-8">Seller Benefits</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {sellerBenefits.map((item, i) => <BenefitCard key={i} item={item} index={i} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}