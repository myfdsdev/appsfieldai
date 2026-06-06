import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-xl p-10 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Join 1,200+ Investors</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight">
              Start Building Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                SaaS Portfolio
              </span>{" "}
              Today
            </h2>

            <p className="text-muted-foreground mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
              Own complete SaaS businesses or invest in shares and participate in the next generation of digital asset ownership.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 font-semibold text-base group h-12">
                Browse Marketplace
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-10 border-border/60 text-foreground hover:bg-secondary font-semibold text-base h-12">
                List Your SaaS
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}