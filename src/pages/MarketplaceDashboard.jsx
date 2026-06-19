import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Zap, Rocket, ExternalLink, LayoutDashboard, Globe, Trash2, User as UserIcon, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import SetupWizard from "@/components/marketplace/SetupWizard";
import MyMarketplaceHub from "@/components/marketplace/MyMarketplaceHub";

export default function MarketplaceDashboard() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = currentUser?.role === "admin";

  // Admins see ALL marketplaces across every owner; regular owners see only their own.
  const { data: marketplaces = [], isLoading } = useQuery({
    queryKey: ["ownerMarketplaces", isAdmin, currentUser?.id],
    queryFn: () => (isAdmin ? base44.entities.Marketplace.list() : base44.entities.Marketplace.filter({ ownerId: currentUser?.id })),
    enabled: !!currentUser?.id,
  });

  // Map owner -> { name, email } so admins can see who owns each marketplace.
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForMarketplaces"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });
  const ownerMap = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => { map[u.id] = u; });
    return map;
  }, [allUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Marketplace.delete(deleteTarget.id);
      toast({ title: "Marketplace deleted", description: `"${deleteTarget.name}" has been removed.` });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message || "Could not delete marketplace.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };
  const { data: plans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ isActive: true }),
  });
  const { data: platformDomain = "" } = useQuery({
    queryKey: ["platformDomain"],
    queryFn: () => base44.functions.invoke("getPlatformDomain", {}).then(r => r.data?.platformDomain || ""),
  });

  // The store's live URL: path-based on the main domain — always works, no DNS needed.
  const storeUrl = (m) => {
    const key = m.subdomain || m.slug;
    return platformDomain ? `https://${platformDomain}/store/${key}` : `/store/${key}`;
  };

  if (view === "wizard") {
    return (
      <div className="p-6">
        <SetupWizard marketplace={selectedMarketplace} onComplete={() => { setView("list"); setSelectedMarketplace(null); }} onCancel={() => { setView("list"); setSelectedMarketplace(null); }} />
      </div>
    );
  }

  if (view === "hub" && selectedMarketplace) {
    return (
      <MyMarketplaceHub marketplace={selectedMarketplace} onBack={() => { setView("list"); setSelectedMarketplace(null); }} />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{isAdmin ? "Admin Marketplace" : "My Marketplaces"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? "Manage every user's marketplace across the platform." : "Build and manage your SaaS marketplace sites."}</p>
        </div>
        <Button onClick={() => { setSelectedMarketplace(null); setView("wizard"); }} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5"><Rocket className="w-4 h-4" /> New Marketplace</Button>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your marketplaces...</div>
      ) : marketplaces.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4"><Store className="w-10 h-10 text-violet-400" /></div>
          <h2 className="text-xl font-display font-semibold">Launch Your First Marketplace</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">Create your own branded SaaS marketplace in minutes. Choose a plan, pick a template, and start listing.</p>
          <Button onClick={() => { setSelectedMarketplace(null); setView("wizard"); }} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl"><Rocket className="w-4 h-4 mr-1.5" />Create Your First Marketplace</Button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaces.map((m, i) => {
            const plan = plans.find(p => p.id === m.planId);
            const owner = ownerMap[m.ownerId];
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl hover:border-violet-500/30 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div>
                        <div>
                          <CardTitle className="text-base font-display">{m.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground">{platformDomain || "app"}/store/{m.subdomain || m.slug}</p>
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
                    {isAdmin && (
                      <div className="mb-3 p-2 rounded-lg bg-secondary/40 border border-border/40 space-y-1">
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><UserIcon className="w-3 h-3" />{owner?.full_name || "Unknown owner"}</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" />{owner?.email || "—"}</p>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => { setSelectedMarketplace(m); setView("hub"); }} className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 hover:from-orange-600 hover:to-amber-600"><LayoutDashboard className="w-3 h-3 mr-1" />Manage</Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(storeUrl(m), "_blank")} className="h-8 text-xs"><ExternalLink className="w-3 h-3 mr-1" />Visit</Button>
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(m)} className="h-8 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete marketplace?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}" Marketplace? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}