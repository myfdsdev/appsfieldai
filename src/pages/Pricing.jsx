import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Zap, Building2, ArrowRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATIC_PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: "Perfect for solo founders testing the market.",
    icon: Zap,
    color: "from-cyan-600 to-blue-600",
    features: ["1 Marketplace", "Up to 10 Listings", "5 Vendors", "Email Support", "Basic Analytics"],
    marketplaceLimit: 1,
    listingLimit: 10,
    vendorLimit: 5,
    customDomainAllowed: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    description: "For growing businesses with multiple listings.",
    icon: Building2,
    color: "from-violet-600 to-purple-600",
    popular: true,
    features: ["3 Marketplaces", "Up to 50 Listings", "25 Vendors", "Priority Support", "Advanced Analytics", "Custom Domain"],
    marketplaceLimit: 3,
    listingLimit: 50,
    vendorLimit: 25,
    customDomainAllowed: true,
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 399,
    yearlyPrice: 3990,
    description: "For agencies managing client marketplaces.",
    icon: Crown,
    color: "from-amber-600 to-orange-600",
    features: ["10 Marketplaces", "Unlimited Listings", "100 Vendors", "Dedicated Support", "White Label", "Custom Domain", "API Access"],
    marketplaceLimit: 10,
    listingLimit: 0,
    vendorLimit: 100,
    customDomainAllowed: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    description: "Unlimited power for enterprise operations.",
    icon: Sparkles,
    color: "from-pink-600 to-rose-600",
    features: ["Unlimited Marketplaces", "Unlimited Listings", "Unlimited Vendors", "24/7 Support", "Full White Label", "Custom Domain", "API Access", "SLA Guarantee"],
    marketplaceLimit: 0,
    listingLimit: 0,
    vendorLimit: 0,
    customDomainAllowed: true,
  },
];

export default function Pricing() {
  const queryClient = useQueryClient();
  const [billing, setBilling] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: activeSub } = useQuery({
    queryKey: ["userSubscription", currentUser?.id],
    queryFn: () => base44.entities.UserSubscription.filter({ userId: currentUser.id, status: "active" }),
    enabled: !!currentUser?.id,
  });
  const currentPlanName = activeSub?.[0]?.planName?.toLowerCase();

  const handleChoosePlan = async (plan) => {
    if (!currentUser) {
      toast.error("Please log in to choose a plan.");
      return;
    }
    setLoadingPlan(plan.id);
    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        toast.error("Checkout is only available in the published app, not in preview frames.");
        setLoadingPlan(null);
        return;
      }

      // Invoke Stripe checkout backend function
      const planKey = `${plan.id}_${billing}`;
      const response = await base44.functions.invoke("stripeSubscribe", { planKey });
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } catch (e) {
      console.error("Checkout error:", e);
      toast.error(e.message || "Something went wrong. Please try again.");
    }
    setLoadingPlan(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Plans & Pricing</Badge>
          <h1 className="text-3xl font-display font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">Launch your marketplace with the right plan. Upgrade anytime as you grow.</p>

          <div className="inline-flex bg-secondary/50 border border-border/40 rounded-xl p-1 mt-6">
            {["monthly", "yearly"].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${billing === b ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                {b}
                {b === "yearly" && <span className="text-[10px] ml-1.5 text-emerald-400 font-semibold">Save ~17%</span>}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATIC_PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isCurrentPlan = currentPlanName === plan.name.toLowerCase();
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className={`border-border/40 bg-card/60 backdrop-blur-xl h-full flex flex-col relative overflow-hidden transition-all ${plan.popular ? "border-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-purple-600" />
                  )}
                  {plan.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                    <div className="mt-2">
                      <span className="text-3xl font-display font-bold text-foreground">${price}</span>
                      <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-xs flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleChoosePlan(plan)}
                      disabled={loadingPlan === plan.id || isCurrentPlan}
                      className={`w-full mt-5 rounded-xl gap-1.5 bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity`}
                    >
                      {loadingPlan === plan.id ? "Processing…" :
                        isCurrentPlan ? "Current Plan" :
                        <>Choose Plan <ArrowRight className="w-4 h-4" /></>}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {activeSub?.[0] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <p className="text-sm text-emerald-400 font-medium">
              ✓ You are currently on the <span className="font-bold">{activeSub[0].planName}</span> plan ({activeSub[0].billingCycle})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Renews {new Date(activeSub[0].currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </motion.div>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}