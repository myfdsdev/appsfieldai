import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { Check, Infinity, Sparkles, Crown, Zap, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const planIcons = { starter: Zap, pro: Building2, agency: Crown, enterprise: Sparkles };

// A limit of -1 (or 0/blank) means unlimited → show the infinity icon instead of the raw number.
const isUnlimited = (v) => v === -1 || v === 0 || v === null || v === undefined;

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const { data: allPlans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ isActive: true }),
  });

  // Regular users only see plans flagged visibleToUsers; admins see all active plans.
  const plans = isAdmin ? allPlans : allPlans.filter((p) => p.visibleToUsers !== false);

  const handleSubscribe = async (plan) => {
    const planSlug = plan.name.toLowerCase().replace(/\s+/g, "_");
    const planKey = `${planSlug}_${billing}`;
    setLoadingPlan(plan.id);
    try {
      const res = await base44.functions.invoke("stripeSubscribe", { planKey });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) { console.error(e); }
    setLoadingPlan(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Plans & Pricing</Badge>
          <h1 className="text-3xl font-display font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Launch your marketplace with the right plan. Upgrade anytime as you grow.</p>
          
          <div className="inline-flex bg-secondary/50 rounded-xl p-1 mt-6">
            {["monthly", "yearly"].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${billing === b ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                {b} {b === "yearly" && <span className="text-[10px] ml-1 text-emerald-400">Save ~17%</span>}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((plan, i) => {
            const Icon = planIcons[plan.name.toLowerCase().replace(/\s+/g, "_")] || Zap;
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const heldPlanIds = [currentUser?.planId, ...(currentUser?.jvzooPlanIds || [])].filter(Boolean);
            const isCurrent = heldPlanIds.includes(plan.id);
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full flex flex-col relative overflow-hidden">
                  {plan.supportLevel === "dedicated" && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />}
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-display font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description || "—"}</p>
                    <div className="mt-2">
                      <span className="text-3xl font-display font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-xs flex-1">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{isUnlimited(plan.marketplaceLimit) ? <Infinity className="w-3 h-3 inline" /> : plan.marketplaceLimit} marketplace{plan.marketplaceLimit !== 1 && "s"}</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{isUnlimited(plan.vendorLimit) ? <Infinity className="w-3 h-3 inline" /> : plan.vendorLimit} vendor{plan.vendorLimit !== 1 && "s"}</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{isUnlimited(plan.productLimit) ? <Infinity className="w-3 h-3 inline" /> : plan.productLimit} listings</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{isUnlimited(plan.customerLimit) ? <Infinity className="w-3 h-3 inline" /> : plan.customerLimit} customers</li>
                      {plan.customDomainAllowed && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />Custom Domain</li>}
                      {plan.multiVendorAllowed && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />Multi-Vendor</li>}
                      {plan.whiteLabelAllowed && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />White-Label</li>}
                      {plan.commissionModuleAllowed && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />Commission Module</li>}
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{plan.supportLevel} support</li>
                    </ul>
                    {isCurrent ? (
                      <Button disabled
                        className="w-full mt-4 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl gap-1.5 disabled:opacity-100 cursor-default hover:bg-emerald-500/15">
                        <CheckCircle2 className="w-4 h-4" /> Subscribed
                      </Button>
                    ) : (
                      <Button onClick={() => handleSubscribe(plan)} disabled={loadingPlan === plan.id}
                        className="w-full mt-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5">
                        {loadingPlan === plan.id ? "Redirecting..." : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}