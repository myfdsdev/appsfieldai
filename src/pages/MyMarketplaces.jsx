import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Store, Settings, Globe, Zap, Plus, Rocket, ExternalLink, Users, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PlanLimitGuard from "@/components/PlanLimitGuard";
import { usePlanLimits } from "@/hooks/usePlanLimits";

export default function MyMarketplaces() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    type: "single_vendor",
    template: "default",
  });

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { canCreateMarketplace, getMarketplaceCount, limits } = usePlanLimits();

  const { data: marketplaces = [], isLoading } = useQuery({
    queryKey: ["ownerMarketplaces"],
    queryFn: () => base44.entities.Marketplace.filter({ ownerId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["platformPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ isActive: true }),
  });

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    try {
      await base44.entities.Marketplace.create({
        ownerId: currentUser.id,
        name: createForm.name,
        slug: createForm.slug,
        type: createForm.type,
        template: createForm.template,
        status: "draft",
        branding: {
          primaryColor: "#7c3aed",
          accentColor: "#06b6d4",
        },
        settings: {
          requireListingApproval: true,
          requireVendorApproval: true,
          allowAuctions: false,
          allowBidding: true,
          commissionRate: 0,
        },
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
      toast.success("Marketplace created!");
      setShowCreate(false);
      setCreateForm({ name: "", slug: "", type: "single_vendor", template: "default" });
    } catch (e) {
      toast.error("Failed to create marketplace");
    }
  };

  const handleUpdate = async () => {
    if (!showEdit) return;
    try {
      await base44.entities.Marketplace.update(showEdit.id, {
        name: showEdit.name,
        slug: showEdit.slug,
        type: showEdit.type,
      });
      queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
      toast.success("Marketplace updated");
      setShowEdit(null);
    } catch (e) {
      toast.error("Failed to update marketplace");
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await base44.entities.Marketplace.delete(showDelete.id);
      queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
      toast.success("Marketplace deleted");
      setShowDelete(null);
    } catch (e) {
      toast.error("Failed to delete marketplace");
    }
  };

  if (!canCreateMarketplace) {
    return <PlanLimitGuard resourceType="marketplace" currentCount={getMarketplaceCount()} limit={limits.marketplaceLimit} />;
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
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5">
            <Plus className="w-4 h-4" /> New Marketplace
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your marketplaces...</div>
      ) : marketplaces.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-display font-semibold">Launch Your First Marketplace</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
            Create your own branded SaaS marketplace in minutes. Choose a plan, pick a template, and start listing.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/pricing">
              <Button variant="outline" className="border-border/40 rounded-xl"><Zap className="w-4 h-4 mr-1.5" />View Plans</Button>
            </Link>
            <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> Create Marketplace
            </Button>
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-display">{m.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground">{m.slug}.yourdomain.com</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge className={`text-[10px] border ${m.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : m.status === "draft" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                          {m.status}
                        </Badge>
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
                      <Link to={`/admin-hub/${m.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20">
                          <LayoutDashboard className="w-3 h-3 mr-1" />Admin Hub
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => setShowEdit(m)} className="h-8 text-xs">
                        <Pencil className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowDelete(m)} className="h-8 text-xs text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3 mr-1" />Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card/95 border-border/40 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Create Marketplace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Marketplace Name *</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., AI Tools Marketplace"
                className="bg-secondary/50 border-border/30 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Slug (URL-friendly) *</Label>
              <Input
                value={createForm.slug}
                onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                placeholder="e.g., ai-tools-market"
                className="bg-secondary/50 border-border/30 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={createForm.type} onValueChange={v => setCreateForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_vendor">Single Vendor</SelectItem>
                  <SelectItem value="multi_vendor">Multi-Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={createForm.template} onValueChange={v => setCreateForm(f => ({ ...f, template: v }))}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="bg-card/95 border-border/40 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Marketplace</DialogTitle>
          </DialogHeader>
          {showEdit && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Marketplace Name *</Label>
                <Input
                  value={showEdit.name}
                  onChange={e => setShowEdit({ ...showEdit, name: e.target.value })}
                  className="bg-secondary/50 border-border/30 rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Slug *</Label>
                <Input
                  value={showEdit.slug}
                  onChange={e => setShowEdit({ ...showEdit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  className="bg-secondary/50 border-border/30 rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={showEdit.type} onValueChange={v => setShowEdit({ ...showEdit, type: v })}>
                  <SelectTrigger className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_vendor">Single Vendor</SelectItem>
                    <SelectItem value="multi_vendor">Multi-Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleUpdate} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="bg-card/95 border-border/40 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Marketplace
            </DialogTitle>
          </DialogHeader>
          {showDelete && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="text-foreground font-medium">"{showDelete.name}"</span>?
                This action cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}