import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Edit3, Trash2, CheckCircle, XCircle, Star, ExternalLink, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AddProductForm from "@/components/marketplace/AddProductForm";

const statusBadge = (status) => {
  const map = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    auction: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    sold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return <Badge className={`text-[10px] border ${map[status] || ""}`}>{status}</Badge>;
};

const dealTypeBadge = (type) => {
  const map = {
    group_deal: { label: "Group Deal", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    single_purchase: { label: "Single Buy", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    both: { label: "Group + Single", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  };
  const cfg = map[type] || map.group_deal;
  return <Badge className={`text-[10px] border ${cfg.color}`}>{cfg.label}</Badge>;
};

export default function SoftwareManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["softwareListings", marketplaceId],
    queryFn: () => base44.entities.SaaSListing.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["softwareCategories", marketplaceId],
    queryFn: () => base44.entities.SoftwareCategory.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const handleAction = async (listing, status) => {
    setActionLoading(listing.id);
    await base44.entities.SaaSListing.update(listing.id, { status });
    queryClient.invalidateQueries({ queryKey: ["softwareListings", marketplaceId] });
    setActionLoading(null);
    toast.success(`${listing.softwareName} ${status}.`);
  };

  const handleFeatureToggle = async (listing) => {
    await base44.entities.SaaSListing.update(listing.id, { featured: !listing.featured });
    queryClient.invalidateQueries({ queryKey: ["softwareListings", marketplaceId] });
    toast.success(`${listing.softwareName} ${listing.featured ? "unfeatured" : "featured"}.`);
  };

  const handleDelete = async (listing) => {
    setActionLoading(listing.id);
    await base44.entities.SaaSListing.delete(listing.id);
    queryClient.invalidateQueries({ queryKey: ["softwareListings", marketplaceId] });
    setActionLoading(null);
    toast.success("Software deleted.");
  };

  // Show add/edit form
  if (showForm) {
    return (
      <AddProductForm
        marketplaceId={marketplaceId}
        listing={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        categories={categories}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-400" /> Software Listings
        </h3>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-xs h-8 text-white border-0">
          <Plus className="w-3 h-3 mr-1" /> Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-sm font-medium mb-1">No products yet</p>
          <p className="text-xs text-muted-foreground mb-4">Add your first SaaS deal to start selling</p>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-xs text-white border-0">
            <Plus className="w-3 h-3 mr-1" /> Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((item) => {
            const spotsLeft = (item.totalShares || 0) - (item.soldShares || 0);
            const progressPct = item.totalShares > 0 ? ((item.soldShares || 0) / item.totalShares) * 100 : 0;
            const hasTimer = !item.noDayLimit && item.dealEndDate;
            const isExpired = hasTimer && new Date(item.dealEndDate) < new Date();

            return (
              <div key={item.id} className="bg-card/40 border border-border/40 rounded-xl p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.imageGradient || "from-orange-500 to-amber-500"} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold text-xs">{(item.softwareName || "?")[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.softwareName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>${(item.price || 0).toLocaleString()}</span>
                        {item.sharePrice > 0 && <span>· ${item.sharePrice}/spot</span>}
                        {item.category && <span>· {item.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {statusBadge(item.status)}
                    {dealTypeBadge(item.dealType)}
                    {item.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {isExpired && <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Expired</Badge>}
                  </div>
                </div>

                {/* Deal progress */}
                {item.totalShares > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.soldShares || 0}/{item.totalShares} spots filled</span>
                      {hasTimer && !isExpired && (
                        <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> Ends {new Date(item.dealEndDate).toLocaleDateString()}</span>
                      )}
                      {item.noDayLimit && <span className="text-emerald-400">No time limit</span>}
                    </div>
                    <Progress value={progressPct} className="h-1.5 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-wrap">
                  {item.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleAction(item, "active")} disabled={actionLoading === item.id} className="h-7 text-[10px] text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleAction(item, "rejected")} disabled={actionLoading === item.id} className="h-7 text-[10px] text-red-400"><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setShowForm(true); }} className="h-7 text-[10px]"><Edit3 className="w-3 h-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleFeatureToggle(item)} className={`h-7 text-[10px] ${item.featured ? "text-amber-400" : ""}`}><Star className="w-3 h-3 mr-1" />{item.featured ? "Unfeature" : "Feature"}</Button>
                  <Link to={`/saas/${item.id}`} target="_blank"><Button size="sm" variant="ghost" className="h-7 text-[10px]"><ExternalLink className="w-3 h-3 mr-1" />View</Button></Link>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item)} disabled={actionLoading === item.id} className="h-7 text-[10px] text-red-400"><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}