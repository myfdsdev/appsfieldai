import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Store, Gavel, Clock, CheckCircle, Ban, Trash2, Pencil, Receipt, ArrowDownRight, CalendarCheck, Building2, Phone, MessageSquare, DollarSign, TrendingUp, BadgeCheck, Mail, Copy, Check, Globe, Ticket, Layers } from "lucide-react";
import DividendPanel from "@/components/admin/DividendPanel";
import QnAManager from "@/components/admin/QnAManager";
import ChatMonitor from "@/components/admin/ChatMonitor";
import PlatformOverview from "@/components/admin/PlatformOverview";
import PlanManager from "@/components/admin/PlanManager";
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
  const [copied, setCopied] = useState({});
  const [activeTab, setActiveTab] = useState("listings");

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const tabs = [
    ...(isSuperAdmin ? [
      { id: "platform", label: "Platform Overview", icon: Globe },
      { id: "plans", label: "Subscription Plans", icon: Ticket },
    ] : []),
    { id: "listings", label: "Listings & Requests", icon: Layers },
  ];

  const doCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 1500);
  };

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
    queryFn: () => base44.entities.DealReservations.list("-created_date", 100),
  });

  const { data: allAcquisitions = [] } = useQuery({
    queryKey: ["allAcquisitions"],
    queryFn: () => base44.entities.AcquisitionRequests.list("-created_date", 100),
  });

  const { data: allBidRequests = [] } = useQuery({
    queryKey: ["allBidRequests"],
    queryFn: () => base44.entities.BidRequests.list("-created_date", 100),
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

  const handleReservationAction = async (r, status) => {
    await base44.entities.DealReservations.update(r.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    const labels = { approved: "approved", rejected: "rejected", contacted: "marked as contacted", deal_in_progress: "marked in progress", deal_closed: "marked as closed" };
    toast.success(`Reservation ${labels[status]}`);
    try {
      await base44.functions.invoke("notifyUserApproval", {
        userEmail: r.userEmail, userName: r.userName, listingTitle: r.listingTitle,
        requestType: "reserve_spot", status, listingId: r.listingId, userId: r.userId,
        phone: r.phone, budget: r.budget, message: r.message,
      });
    } catch (e) { console.error("notify user failed", e); }
  };

  const handleReservationDelete = async (r) => {
    await base44.entities.DealReservations.delete(r.id);
    queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    toast.success("Reservation deleted");
  };

  const handleAcquisitionAction = async (a, status) => {
    await base44.entities.AcquisitionRequests.update(a.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] });
    const labels = { approved: "approved", rejected: "rejected", contacted: "marked as contacted", deal_in_progress: "marked in progress", deal_closed: "marked as closed" };
    toast.success(`Request ${labels[status]}`);
    try {
      await base44.functions.invoke("notifyUserApproval", {
        userEmail: a.userEmail, userName: a.userName, listingTitle: a.listingTitle,
        requestType: "acquisition_request", status, listingId: a.listingId, userId: a.userId,
        phone: a.phone, offerAmount: a.offerAmount, notes: a.notes,
      });
    } catch (e) { console.error("notify user failed", e); }
  };

  const handleAcquisitionDelete = async (a) => {
    await base44.entities.AcquisitionRequests.delete(a.id);
    queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] });
    toast.success("Acquisition request deleted");
  };

  const handleBidRequestAction = async (br, status) => {
    await base44.entities.BidRequests.update(br.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allBidRequests"] });
    const labels = { approved: "approved", rejected: "rejected", contacted: "marked as contacted" };
    toast.success(`Bid request ${labels[status]}`);
    try {
      await base44.functions.invoke("notifyBidStatus", {
        userId: br.userId, userEmail: br.userEmail, userName: br.userName,
        listingTitle: br.listingTitle, listingId: br.listingId,
        requestType: "bid_request", status, requestId: br.id, bidAmount: br.bidAmount,
      });
    } catch (e) { console.error("notify bid status failed", e); }
  };

  const handleBidRequestDelete = async (br) => {
    await base44.entities.BidRequests.delete(br.id);
    queryClient.invalidateQueries({ queryKey: ["allBidRequests"] });
    toast.success("Bid request deleted");
  };

  const statusBadge = (s) => {
    const configs = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
      contacted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      cancelled: "bg-muted text-muted-foreground border-border/30",
      deal_in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      deal_closed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    const labels = { deal_in_progress: "In Progress", deal_closed: "Closed" };
    return <Badge className={`text-[10px] border ${configs[s] || configs.pending}`}>{labels[s] || s}</Badge>;
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
        <div className="flex gap-2 flex-wrap mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {activeTab === "platform" && <PlatformOverview />}
      {activeTab === "plans" && <PlanManager />}

      {activeTab === "listings" && (
      <>
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
      </>
      )}
    </div>
  );
}