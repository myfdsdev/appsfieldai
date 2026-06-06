import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Store, Gavel, DollarSign, Clock, CheckCircle, Ban, Eye, Trash2, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [editListing, setEditListing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: allListings = [], isLoading } = useQuery({
    queryKey: ["allListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const pendingListings = allListings.filter((l) => l.status === "pending");
  const activeListings = allListings.filter((l) => l.status === "active");
  const auctionListings = allListings.filter((l) => l.status === "auction");
  const rejectedListings = allListings.filter((l) => l.status === "rejected");

  const stats = [
    { icon: Store, label: "Total Listings", value: allListings.length, color: "from-violet-500 to-purple-500" },
    { icon: Gavel, label: "Active Auctions", value: auctionListings.length, color: "from-amber-500 to-orange-500" },
    { icon: Clock, label: "Pending", value: pendingListings.length, color: "from-cyan-500 to-teal-500" },
    { icon: Ban, label: "Rejected", value: rejectedListings.length, color: "from-red-500 to-rose-500" },
  ];

  const handleApprove = async (listing) => {
    await base44.entities.SaaSListing.update(listing.id, { status: "active" });
    queryClient.invalidateQueries({ queryKey: ["allListings"] });
    toast.success(`"${listing.title}" approved`);
  };

  const handleReject = async (listing) => {
    await base44.entities.SaaSListing.update(listing.id, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["allListings"] });
    toast.success(`"${listing.title}" rejected`);
  };

  const handleDelete = async (listing) => {
    await base44.entities.SaaSListing.delete(listing.id);
    queryClient.invalidateQueries({ queryKey: ["allListings"] });
    toast.success(`"${listing.title}" deleted`);
  };

  const openEdit = (listing) => {
    setEditListing(listing);
    setEditForm({ title: listing.title, category: listing.category, fullPrice: listing.fullPrice, sharePrice: listing.sharePrice, monthlyRevenue: listing.monthlyRevenue, monthlyExpenses: listing.monthlyExpenses, description: listing.description || "" });
  };

  const handleEditSave = async () => {
    if (!editListing) return;
    await base44.entities.SaaSListing.update(editListing.id, {
      ...editForm,
      fullPrice: parseFloat(editForm.fullPrice) || 0,
      sharePrice: parseFloat(editForm.sharePrice) || 0,
      monthlyRevenue: parseFloat(editForm.monthlyRevenue) || 0,
      monthlyExpenses: parseFloat(editForm.monthlyExpenses) || 0,
    });
    queryClient.invalidateQueries({ queryKey: ["allListings"] });
    setEditListing(null);
    toast.success("Listing updated");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage listings and platform operations.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-display font-bold">{isLoading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Approvals
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{pendingListings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {pendingListings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending listings</p>
            ) : (
              pendingListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.title}</p>
                      <p className="text-[11px] text-muted-foreground">{l.sellerName || "Unknown"} · {l.category} · ${l.fullPrice?.toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="text-muted-foreground hover:text-foreground h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleApprove(l)} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 text-xs"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(l)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"><Ban className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* All Listings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-400" />
              All Listings
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allListings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allListings.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Store className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="text-[11px] text-muted-foreground">{l.category} · ${l.fullPrice?.toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border ${
                    l.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    l.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    l.status === "auction" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                    l.status === "sold" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>{l.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-red-400/60 hover:text-red-400 h-8 text-xs"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={!!editListing} onOpenChange={() => setEditListing(null)}>
        <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Edit Listing</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Title</label><Input value={editForm.title || ""} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Full Price</label><Input type="number" value={editForm.fullPrice || ""} onChange={(e) => setEditForm((f) => ({ ...f, fullPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Share Price</label><Input type="number" value={editForm.sharePrice || ""} onChange={(e) => setEditForm((f) => ({ ...f, sharePrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Monthly Revenue</label><Input type="number" value={editForm.monthlyRevenue || ""} onChange={(e) => setEditForm((f) => ({ ...f, monthlyRevenue: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Monthly Expenses</label><Input type="number" value={editForm.monthlyExpenses || ""} onChange={(e) => setEditForm((f) => ({ ...f, monthlyExpenses: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Description</label><Input value={editForm.description || ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}