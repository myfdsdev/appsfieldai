import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Angel Investor",
    text: "I bought shares in 3 SaaS products for under $1,000 total. Now I'm earning $180/month in passive revenue. This is the future of digital investing.",
    avatar: "AR",
    returns: "+23% ROI",
  },
  {
    name: "Sarah Chen",
    role: "SaaS Founder",
    text: "I sold fractional shares of my CRM tool and raised $4,000 in capital while keeping 60% ownership. Brilliant concept for bootstrapped founders.",
    avatar: "SC",
    returns: "$4K Raised",
  },
  {
    name: "Marcus Thompson",
    role: "Portfolio Investor",
    text: "The dashboard is incredible. I can track all my SaaS investments, revenue distributions, and resell shares. It's like a stock market for SaaS.",
    avatar: "MT",
    returns: "8 SaaS Owned",
  },
];

export default function TestimonialsSection() {
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
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Investor Success Stories</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array(5).fill(0).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="relative mb-5">
                <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                <p className="text-sm text-muted-foreground leading-relaxed pl-4">{t.text}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                  {t.returns}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}