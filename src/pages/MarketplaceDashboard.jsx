import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Zap, Rocket, ExternalLink, LayoutDashboard, Globe, Trash2, User as UserIcon, Mail, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import SetupWizard from "@/components/marketplace/SetupWizard";
import MyMarketplaceHub from "@/components/marketplace/MyMarketplaceHub";
import OwnerStatsOverview from "@/components/dashboard/OwnerStatsOverview";
import SalesAnalytics from "@/components/dashboard/SalesAnalytics";
import MarketplaceStoreCard from "@/components/dashboard/MarketplaceStoreCard";
import MarketplaceDashboardBanner from "@/components/dashboard/MarketplaceDashboardBanner";
import RecentReservations from "@/components/dashboard/RecentReservations";
import UpgradePlanDialog from "@/components/marketplace/UpgradePlanDialog";

export default function MarketplaceDashboard() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Resolve the user's plan to know how many stores they're allowed (admins are unlimited).
  const { data: userPlan = null } = useQuery({
    queryKey: ["userPlan", currentUser?.planId],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ id: currentUser.planId }).then(r => r[0] || null),
    enabled: !!currentUser?.planId,
  });
  const storeLimit = userPlan?.storeLimit ?? 0;

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

  // Search filter: match by marketplace name, owner name, or owner email.
  const filteredMarketplaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return marketplaces;
    return marketplaces.filter((m) => {
      const owner = ownerMap[m.ownerId];
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (owner?.full_name || "").toLowerCase().includes(q) ||
        (owner?.email || "").toLowerCase().includes(q)
      );
    });
  }, [marketplaces, ownerMap, search]);

  // Paginate the filtered list — 6 marketplaces per page.
  const totalPages = Math.max(1, Math.ceil(filteredMarketplaces.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedMarketplaces = useMemo(
    () => filteredMarketplaces.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filteredMarketplaces, currentPage]
  );
  // Reset to first page whenever the search filter changes.
  useEffect(() => { setPage(1); }, [search]);

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

  // Gate store creation by plan limit (admins bypass). Owns-count comes from the user's own marketplaces.
  const ownedCount = isAdmin ? 0 : marketplaces.filter(m => m.ownerId === currentUser?.id).length;
  const startCreate = () => {
    if (!isAdmin && ownedCount >= storeLimit) { setShowUpgrade(true); return; }
    setSelectedMarketplace(null); setView("wizard");
  };
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
    <div className="space-y-6 p-6 w-screen relative left-1/2 right-1/2 -mx-[50vw]">
      <MarketplaceDashboardBanner
        title={isAdmin ? "Admin Marketplace" : "My Marketplaces"}
        subtitle={isAdmin ? "Manage every user's marketplace across the platform." : "Build and manage your SaaS marketplace sites."}
      >
        <Button onClick={startCreate} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5 shrink-0"><Rocket className="w-4 h-4" /> New Marketplace</Button>
      </MarketplaceDashboardBanner>

      {/* Product/sales overview stat cards — always shown, pulled up to overlap the hero banner */}
      {!isLoading && (
        <div className="relative z-10 -mt-12 px-2">
          <OwnerStatsOverview marketplaces={marketplaces} />
        </div>
      )}

      {/* Sales analytics: chart with day/week/year + marketplace selector + profit/activity card */}
      {!isLoading && (
        <SalesAnalytics marketplaces={marketplaces} />
      )}

      {/* Marketplace section header — title + search sit directly above the grid */}
      {!isLoading && marketplaces.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <h2 className="text-lg font-display font-semibold">{isAdmin ? "All Stores" : "My Stores"}</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by store, owner, or email..."
              className="pl-9 h-10 rounded-xl text-sm"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your marketplaces...</div>
      ) : marketplaces.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4"><Store className="w-10 h-10 text-violet-400" /></div>
          <h2 className="text-xl font-display font-semibold">Launch Your First Marketplace</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">Create your own branded SaaS marketplace in minutes. Choose a plan, pick a template, and start listing.</p>
          <Button onClick={startCreate} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl"><Rocket className="w-4 h-4 mr-1.5" />Create Your First Marketplace</Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {filteredMarketplaces.length === 0 ? (
            <p className="text-center py-12 text-sm text-muted-foreground">No marketplaces match "{search}".</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedMarketplaces.map((m, i) => (
                  <MarketplaceStoreCard
                    key={m.id}
                    m={m}
                    i={i}
                    plan={plans.find(p => p.id === m.planId)}
                    owner={ownerMap[m.ownerId]}
                    isAdmin={isAdmin}
                    platformDomain={platformDomain}
                    storeUrl={storeUrl}
                    onManage={(mp) => { setSelectedMarketplace(mp); setView("hub"); }}
                    onVisit={(mp) => window.open(storeUrl(mp), "_blank")}
                    onDelete={(mp) => setDeleteTarget(mp)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-lg gap-1" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg w-9"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-lg gap-1" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Recent reserve spot activity — only for regular owners with marketplaces */}
      {!isAdmin && !isLoading && marketplaces.length > 0 && (
        <RecentReservations marketplaces={marketplaces} />
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

      <UpgradePlanDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} storeLimit={storeLimit} hasPlan={!!currentUser?.planId} />
    </div>
  );
}