import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Lock, FileText, BarChart3 } from "lucide-react";

const trustItems = [
  { icon: <BadgeCheck className="w-6 h-6" />, title: "Verified SaaS Listings", desc: "Every SaaS undergoes thorough verification before listing.", color: "text-emerald-400" },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Revenue Verification", desc: "All revenue claims are independently verified.", color: "text-primary" },
  { icon: <Lock className="w-6 h-6" />, title: "Secure Escrow Payments", desc: "All transactions processed through secure escrow.", color: "text-violet-400" },
  { icon: <FileText className="w-6 h-6" />, title: "Ownership Contracts", desc: "Legally binding smart contracts for every deal.", color: "text-amber-400" },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Investor Dashboard", desc: "Full transparency with real-time portfolio tracking.", color: "text-cyan-400" },
];

export default function TrustSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Trust & Security</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Built on Trust</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Your investments are protected by industry-leading security measures</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {trustItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6 text-center hover:border-primary/20 transition-all duration-300"
            >
              <div className={`${item.color} mx-auto w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h4 className="font-display font-bold text-sm mb-2">{item.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}