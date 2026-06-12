import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Store, Settings, Globe, Zap, Plus, Rocket, ExternalLink, Users } from "lucide-react";
import VendorManagement from "@/components/vendor/VendorManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SetupWizard from "@/components/marketplace/SetupWizard";
import MarketplaceSettings from "@/components/marketplace/MarketplaceSettings";

export default function MarketplaceDashboard() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const [vendorMgmtMarketplaceId, setVendorMgmtMarketplaceId] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: marketplaces = [], isLoading } = useQuery({
    queryKey: ["ownerMarketplaces"],
    queryFn: () => base44.entities.Marketplace.filter({ ownerId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ isActive: true }),
  });

  if (view === "wizard") {
    return (
      <div className="p-6">
        <SetupWizard marketplace={selectedMarketplace} onComplete={() => { setView("list"); setSelectedMarketplace(null); }} onCancel={() => { setView("list"); setSelectedMarketplace(null); }} />
      </div>
    );
  }

  if (view === "settings" && selectedMarketplace) {
    return (
      <div className="p-6">
        <MarketplaceSettings marketplace={selectedMarketplace} onBack={() => { setView("list"); setSelectedMarketplace(null); }} />
      </div>
    );
  }

  if (view === "vendors" && vendorMgmtMarketplaceId) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => { setView("list"); setVendorMgmtMarketplaceId(null); }} className="rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Button>
            <h2 className="text-xl font-display font-bold">Vendor Management</h2>
          </div>
          <VendorManagement marketplaceId={vendorMgmtMarketplaceId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Marketplaces</h1>
          <p className="text-sm text-muted-foreground mt-1">Build and manage your SaaS marketplace sites.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pricing">
            <Button variant="outline" className="border-border/40 rounded-xl gap-1.5"><Zap className="w-4 h-4" /> Plans</Button>
          </Link>
          <Button onClick={() => { setSelectedMarketplace(null); setView("wizard"); }} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5"><Rocket className="w-4 h-4" /> Setup Wizard</Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your marketplaces...</div>
      ) : marketplaces.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4"><Store className="w-10 h-10 text-violet-400" /></div>
          <h2 className="text-xl font-display font-semibold">Launch Your First Marketplace</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">Create your own branded SaaS marketplace in minutes. Choose a plan, pick a template, and start listing.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/pricing"><Button variant="outline" className="border-border/40 rounded-xl"><Zap className="w-4 h-4 mr-1.5" />View Plans</Button></Link>
            <Button onClick={() => { setSelectedMarketplace(null); setView("wizard"); }} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl"><Rocket className="w-4 h-4 mr-1.5" />Launch Setup Wizard</Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaces.map((m, i) => {
            const plan = plans.find(p => p.id === m.planId);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl hover:border-violet-500/30 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div>
                        <div>
                          <CardTitle className="text-base font-display">{m.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground">{m.slug}.yourdomain.com</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge className={`text-[10px] border ${m.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : m.status === "draft" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{m.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{m.type === "multi_vendor" ? "Multi-Vendor" : "Single Vendor"}</span>
                      {plan && <span className="flex items-center gap-1 text-violet-400"><Zap className="w-3 h-3" />{plan.name}</span>}
                      {m.template && <span className="capitalize">{m.template}</span>}
                    </div>
                    {m.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {m.categories.slice(0, 3).map(c => <Badge key={c} variant="secondary" className="text-[9px]">{c}</Badge>)}
                        {m.categories.length > 3 && <Badge variant="secondary" className="text-[9px]">+{m.categories.length - 3}</Badge>}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedMarketplace(m); setView("settings"); }} className="h-8 text-xs"><Settings className="w-3 h-3 mr-1" />Settings</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedMarketplace(m); setView("wizard"); }} className="h-8 text-xs"><Rocket className="w-3 h-3 mr-1" />Setup</Button>
                      {m.type === "multi_vendor" && (
                        <Button size="sm" variant="ghost" onClick={() => { setVendorMgmtMarketplaceId(m.id); setView("vendors"); }} className="h-8 text-xs"><Users className="w-3 h-3 mr-1" />Vendors</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => window.open(`https://${m.subdomain || m.slug}.yourplatform.com`, "_blank")} className="h-8 text-xs"><ExternalLink className="w-3 h-3 mr-1" />Visit</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}