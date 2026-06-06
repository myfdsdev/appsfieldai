import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, DollarSign, Percent } from "lucide-react";

export default function CalculatorSection() {
  const [saasValue, setSaasValue] = useState(10000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(1000);
  const [shares, setShares] = useState(50);

  const results = useMemo(() => {
    const shareCost = shares > 0 ? saasValue / shares : 0;
    const revenuePerShare = shares > 0 ? monthlyRevenue / shares : 0;
    const annualRoi = shareCost > 0 ? ((revenuePerShare * 12) / shareCost) * 100 : 0;
    return { shareCost, revenuePerShare, annualRoi };
  }, [saasValue, monthlyRevenue, shares]);

  return (
    <section id="calculator" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Revenue Calculator</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Calculate Your Returns</h2>
          <p className="text-muted-foreground mt-4">See how much you could earn from fractional SaaS ownership</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-8"
        >
          {/* Inputs */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Investment Parameters</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-muted-foreground">SaaS Value</Label>
                <span className="text-sm font-bold text-primary">${saasValue.toLocaleString()}</span>
              </div>
              <Slider
                value={[saasValue]}
                onValueChange={([v]) => setSaasValue(v)}
                min={1000}
                max={100000}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>$1,000</span><span>$100,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-muted-foreground">Monthly Revenue</Label>
                <span className="text-sm font-bold text-emerald-400">${monthlyRevenue.toLocaleString()}</span>
              </div>
              <Slider
                value={[monthlyRevenue]}
                onValueChange={([v]) => setMonthlyRevenue(v)}
                min={100}
                max={20000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>$100</span><span>$20,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-muted-foreground">Number of Shares</Label>
                <span className="text-sm font-bold">{shares}</span>
              </div>
              <Slider
                value={[shares]}
                onValueChange={([v]) => setShares(v)}
                min={5}
                max={200}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5</span><span>200</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 flex flex-col justify-center space-y-6">
            <h3 className="font-display font-bold text-lg mb-2">Your Estimated Returns</h3>

            <ResultCard
              icon={<DollarSign className="w-5 h-5 text-primary" />}
              label="Cost Per Share"
              value={`$${results.shareCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              desc="One-time investment per share"
            />
            <ResultCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Revenue Per Share"
              value={`$${results.revenuePerShare.toFixed(2)}/mo`}
              desc="Monthly passive income per share"
            />
            <ResultCard
              icon={<Percent className="w-5 h-5 text-amber-400" />}
              label="Annual ROI"
              value={`${results.annualRoi.toFixed(1)}%`}
              desc="Estimated yearly return on investment"
              highlight={results.annualRoi > 50}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ResultCard({ icon, label, value, desc, highlight }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-amber-500/30 bg-amber-500/5" : "border-border/40 bg-secondary/40"}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}