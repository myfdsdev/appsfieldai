import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Star, FileText, Radar, Lock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import FindLeadsTab from "@/components/leadfinder/FindLeadsTab";
import ShortlistTab from "@/components/leadfinder/ShortlistTab";
import LeadTemplatesTab from "@/components/leadfinder/LeadTemplatesTab";
import EmailHistoryTab from "@/components/leadfinder/EmailHistoryTab";

export default function LeadFinder() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [tab, setTab] = useState("find");

  const { data: userPlan = null, isLoading: planLoading } = useQuery({
    queryKey: ["userPlan", user?.planId],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ id: user.planId }).then((r) => r[0] || null),
    enabled: !!user?.planId,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["ownerMarketplaces", user?.id],
    queryFn: () => base44.entities.Marketplace.filter({ ownerId: user?.id }, "-created_date"),
    enabled: !!user?.id,
  });

  const allowed = isAdmin || userPlan?.leadFinderAllowed;

  if (!user || planLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto"><Lock className="w-7 h-7 text-orange-400" /></div>
        <h1 className="text-xl font-display font-bold">Lead Finder is a premium feature</h1>
        <p className="text-sm text-muted-foreground">Upgrade to a plan that includes Lead Finder to research potential clients and invite them to your store.</p>
        <Button asChild className="gap-2"><Link to="/pricing">View Plans</Link></Button>
      </div>
    );
  }

  const tabs = [
    { id: "find", label: "Find Leads", icon: Search },
    { id: "shortlist", label: "Shortlist", icon: Star },
    { id: "history", label: "Email History", icon: History },
    { id: "templates", label: "Email Templates", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Radar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Lead Finder</h1>
          <p className="text-sm text-muted-foreground">Find potential clients and invite them to your store.</p>
        </div>
      </motion.div>

      <div className="flex gap-2 border-b border-border/40">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === t.id ? "border-orange-500 text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "find" && <FindLeadsTab ownerId={user.id} />}
        {tab === "shortlist" && <ShortlistTab ownerId={user.id} />}
        {tab === "history" && <EmailHistoryTab ownerId={user.id} />}
        {tab === "templates" && <LeadTemplatesTab ownerId={user.id} stores={stores} />}
      </motion.div>
    </div>
  );
}