import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe, Users, Building2, CreditCard, DollarSign, TrendingUp, Activity, BarChart3, Pencil, Ban, CheckCircle, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PlatformOverview() {
  const queryClient = useQueryClient();
  const [editMP, setEditMP] = useState(null);
  const [editMPForm, setEditMPForm] = useState({});

  const { data: marketplaces = [], isLoading: mpLoading } = useQuery({
    queryKey: ["platformMarketplaces"],
    queryFn: () => base44.entities.Marketplace.list(),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["platformUsers"],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["platformListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const owners = users.filter((u) => u.role === "marketplace_owner" || u.role === "admin");
  const activeMPs = marketplaces.filter((m) => m.status === "active");
  const suspendedMPs = marketplaces.filter((m) => m.status === "suspended");
  const customDomains = marketplaces.filter((m) => m.customDomain && m.domainStatus === "active");

  const stats = [
    { icon: Globe, label: "Total Marketplaces", value: marketplaces.length, sub: `${activeMPs.length} active`, color: "from-violet-500 to-purple-500" },
    { icon: Building2, label: "Marketplace Owners", value: owners.length, sub: `${plans.length} plans available`, color: "from-cyan-500 to-teal-500" },
    { icon: BarChart3, label: "Total Listings", value: listings.length, sub: "across all marketplaces", color: "from-amber-500 to-orange-500" },
    { icon: Users, label: "Total Users", value: users.length, sub: `${suspendedMPs.length} suspended`, color: "from-emerald-500 to-green-500" },
    { icon: Globe, label: "Custom Domains", value: customDomains.length, sub: "active domains", color: "from-blue-500 to-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-rose-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Platform Overview</h2>
            <p className="text-sm text-muted-foreground">Super admin dashboard — manage all marketplaces, owners, and platform settings.</p>
          </div>
        </div>
      </motion.div>

      {/* Platform Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-display font-bold">{mpLoading ? "—" : s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Marketplaces List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              <h3 className="font-display font-semibold text-sm">All Marketplaces</h3>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{marketplaces.length}</Badge>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {marketplaces.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No marketplaces created yet</p>
            ) : (
              marketplaces.map((mp) => {
                const owner = users.find((u) => u.id === mp.ownerId);
                return (
                  <div key={mp.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        mp.status === "active" ? "bg-emerald-500/10" :
                        mp.status === "suspended" ? "bg-red-500/10" : "bg-amber-500/10"
                      }`}>
                        <Globe className={`w-4 h-4 ${
                          mp.status === "active" ? "text-emerald-400" :
                          mp.status === "suspended" ? "text-red-400" : "text-amber-400"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{mp.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{mp.slug}</span>
                          <span className="text-[10px] text-violet-400">{owner?.full_name || owner?.email || "—"}</span>
                          <Badge className={`text-[10px] border ${
                            mp.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            mp.status === "suspended" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>{mp.status}</Badge>
                          <Badge className="text-[10px] bg-secondary text-muted-foreground border-border/30">{mp.type === "multi_vendor" ? "Multi-Vendor" : "Single-Vendor"}</Badge>
                          {mp.customDomain && (
                            <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{mp.customDomain}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => { setEditMP(mp); setEditMPForm({ name: mp.name, status: mp.status, type: mp.type, commissionRate: mp.settings?.commissionRate || 0 }); }} className="h-7 text-[11px]"><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                      {mp.status === "active" ? (
                        <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.Marketplace.update(mp.id, { status: "suspended" }); queryClient.invalidateQueries({ queryKey: ["platformMarketplaces"] }); toast.success(`"${mp.name}" suspended`); }} className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" />Suspend</Button>
                      ) : mp.status === "suspended" ? (
                        <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.Marketplace.update(mp.id, { status: "active" }); queryClient.invalidateQueries({ queryKey: ["platformMarketplaces"] }); toast.success(`"${mp.name}" reactivated`); }} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" />Activate</Button>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground ml-1">{new Date(mp.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

      {/* Marketplace Owners */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-semibold text-sm">Marketplace Owners</h3>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">{owners.length}</Badge>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {owners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No marketplace owners yet</p>
            ) : (
              owners.map((o) => {
                const ownerMPs = marketplaces.filter((m) => m.ownerId === o.id);
                const plan = plans.find((p) => p.id === o.planId);
                return (
                  <div key={o.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{o.full_name || o.email || "Unknown"}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{o.email}</span>
                          {o.businessName && <span className="text-[10px] text-violet-400">{o.businessName}</span>}
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{o.billingStatus || "trial"}</Badge>
                          <Badge className={`text-[10px] border ${
                            o.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            o.status === "suspended" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>{o.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{ownerMPs.length} marketplace(s)</span>
                      <span className="text-[10px] font-medium text-violet-400">{plan?.name || "No Plan"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

      {/* Edit Marketplace Dialog */}
      <Dialog open={!!editMP} onOpenChange={() => setEditMP(null)}>
        <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Settings className="w-4 h-4 text-violet-400" />Edit Marketplace</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Name</label><Input value={editMPForm.name || ""} onChange={e => setEditMPForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={editMPForm.status || ""} onValueChange={v => setEditMPForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <Select value={editMPForm.type || ""} onValueChange={v => setEditMPForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_vendor">Single Vendor</SelectItem>
                    <SelectItem value="multi_vendor">Multi Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs text-muted-foreground">Commission Rate (%)</label><Input type="number" value={editMPForm.commissionRate || 0} onChange={e => setEditMPForm(f => ({ ...f, commissionRate: parseFloat(e.target.value) || 0 }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMP(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={async () => {
              if (!editMP) return;
              await base44.entities.Marketplace.update(editMP.id, {
                name: editMPForm.name,
                status: editMPForm.status,
                type: editMPForm.type,
                settings: { ...editMP.settings, commissionRate: editMPForm.commissionRate }
              });
              queryClient.invalidateQueries({ queryKey: ["platformMarketplaces"] });
              setEditMP(null);
              toast.success(`"${editMPForm.name}" updated`);
            }} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}