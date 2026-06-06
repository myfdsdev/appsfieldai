import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, Handshake, DollarSign, Briefcase } from "lucide-react";

const stats = [
  { icon: <BarChart3 className="w-6 h-6" />, target: 85, suffix: "+", label: "Total SaaS Listed", color: "text-primary" },
  { icon: <Users className="w-6 h-6" />, target: 1200, suffix: "+", label: "Total Investors", color: "text-violet-400" },
  { icon: <Handshake className="w-6 h-6" />, target: 340, suffix: "+", label: "Ownership Deals", color: "text-emerald-400" },
  { icon: <DollarSign className="w-6 h-6" />, target: 2.4, suffix: "M+", label: "Revenue Distributed", prefix: "$", color: "text-amber-400", decimals: 1 },
  { icon: <Briefcase className="w-6 h-6" />, target: 42, suffix: "", label: "Active Listings", color: "text-rose-400" },
];

function AnimatedCounter({ target, suffix = "", prefix = "", decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-display font-bold">
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-8 sm:p-12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`${stat.color} mx-auto mb-3 w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <AnimatedCounter target={stat.target} suffix={stat.suffix} prefix={stat.prefix} decimals={stat.decimals} />
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}