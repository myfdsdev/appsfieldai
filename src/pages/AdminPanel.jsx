import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Store, Gavel, Clock, CheckCircle, Ban, Trash2, Pencil, Receipt, ArrowDownRight, CalendarCheck, Building2, Phone, MessageSquare, DollarSign } from "lucide-react";
import DividendPanel from "@/components/admin/DividendPanel";
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

  const { data: allBids = [] } = useQuery({
    queryKey: ["allBids"],
    queryFn: () => base44.entities.Bid.filter({}, ["-created_date"], 100),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["allTransactions"],
    queryFn: () => base44.entities.Transaction.filter({}, ["-created_date"], 100),
  });

  const { data: allReservations = [] } = useQuery({
    queryKey: ["allReservations"],
    queryFn: () => base44.entities.DealReservations.filter({}, ["-created_date"], 100),
  });

  const { data: allAcquisitions = [] } = useQuery({
    queryKey: ["allAcquisitions"],
    queryFn: () => base44.entities.AcquisitionRequests.filter({}, ["-created_date"], 100),
  });

  const enrichedBids = useMemo(() => {
    const listingMap = {};
    allListings.forEach((l) => { listingMap[l.id] = l.title; });
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u.full_name || u.email; });
    return allBids.map((b) => ({
      ...b,
      listingTitle: listingMap[b.listingId] || "Unknown Listing",
      bidderName: userMap[b.userId] || "Unknown User",
    }));
  }, [allBids, allListings, allUsers]);

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

  // Reservation actions
  const handleReservationAction = async (r, status) => {
    await base44.entities.DealReservations.update(r.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    const labels = { approved: "approved", rejected: "rejected", contacted: "marked as contacted" };
    toast.success(`Reservation ${labels[status]}`);
  };

  const handleReservationDelete = async (r) => {
    await base44.entities.DealReservations.delete(r.id);
    queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    toast.success("Reservation deleted");
  };

  // Acquisition actions
  const handleAcquisitionAction = async (a, status) => {
    await base44.entities.AcquisitionRequests.update(a.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] });
    const labels = { approved: "approved", rejected: "rejected", contacted: "marked as contacted" };
    toast.success(`Request ${labels[status]}`);
  };

  const handleAcquisitionDelete = async (a) => {
    await base44.entities.AcquisitionRequests.delete(a.id);
    queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] });
    toast.success("Acquisition request deleted");
  };

  const statusBadge = (s) => {
    const configs = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
      contacted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      cancelled: "bg-muted text-muted-foreground border-border/30",
    };
    return <Badge className={`text-[10px] border ${configs[s] || configs.pending}`}>{s}</Badge>;
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

      {/* Spot Reservations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-violet-400" />
              Spot Reservations
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allReservations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No reservations yet</p>
            ) : (
              allReservations.map((r) => (
                <div key={r.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{r.userName || "Unknown"}</p>
                      <span className="text-xs text-muted-foreground">{r.userEmail}</span>
                    </div>
                    <p className="text-xs text-violet-400">{r.listingTitle || "Unknown Listing"}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {r.phone && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {r.phone}
                        </span>
                      )}
                      {r.budget > 0 && (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ${r.budget?.toLocaleString()}
                        </span>
                      )}
                      {statusBadge(r.status)}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {r.message && (
                      <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{r.message}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "approved")} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" /> Contacted</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "rejected")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" /> Reject</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleReservationDelete(r)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Acquisition Requests */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              Acquisition Requests
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allAcquisitions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allAcquisitions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No acquisition requests yet</p>
            ) : (
              allAcquisitions.map((a) => (
                <div key={a.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{a.userName || "Unknown"}</p>
                      <span className="text-xs text-muted-foreground">{a.userEmail}</span>
                    </div>
                    <p className="text-xs text-violet-400">{a.listingTitle || "Unknown Listing"}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {a.phone && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </span>
                      )}
                      {a.offerAmount > 0 && (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ${a.offerAmount?.toLocaleString()}
                        </span>
                      )}
                      {statusBadge(a.status)}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {a.notes && (
                      <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{a.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "approved")} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" /> Contacted</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "rejected")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" /> Reject</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleAcquisitionDelete(a)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Bids */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              All Bids
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{enrichedBids.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {enrichedBids.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No bids placed yet</p>
            ) : (
              enrichedBids.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Gavel className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.bidderName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{b.listingTitle} · {new Date(b.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-amber-400 flex-shrink-0 ml-3">${b.bidAmount?.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Receipt className="w-4 h-4 text-violet-400" />
              Transaction History
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
            ) : (
              allTransactions.slice(0, 30).map((t) => {
                const isPositive = t.amount > 0;
                const typeLabel = {
                  share_purchase: "Share Purchase",
                  full_ownership_purchase: "Full Ownership",
                  deposit: "Deposit", withdrawal: "Withdrawal",
                  dividend: "Dividend", sale_revenue: "Sale Revenue",
                }[t.type] || t.type;
                return (
                  <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                        <ArrowDownRight className={`w-4 h-4 ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{typeLabel}</p>
                          {t.userName && <p className="text-xs text-violet-400">{t.userName}</p>}
                          {t.userEmail && <p className="text-xs text-muted-foreground">{t.userEmail}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {t.listingTitle && <span className="text-[10px] text-muted-foreground">{t.listingTitle}</span>}
                          <Badge className={`text-[10px] border ${t.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : t.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{t.status}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-display font-bold shrink-0 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? "+" : ""}{t.type === "share_purchase" || t.type === "full_ownership_purchase" ? "-" : ""}${Math.abs(t.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })
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

      {/* Dividend Panel */}
      <DividendPanel />

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