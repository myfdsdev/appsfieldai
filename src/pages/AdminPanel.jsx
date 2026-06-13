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
import UserManager from "@/components/admin/UserManager";
import MarketplaceManager from "@/components/admin/MarketplaceManager";
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
  const [editBid, setEditBid] = useState(null);
  const [editBidForm, setEditBidForm] = useState({});
  const [copied, setCopied] = useState({});
  const [activeTab, setActiveTab] = useState("listings");

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const tabs = [
    ...(isSuperAdmin ? [
      { id: "platform", label: "Platform Overview", icon: Globe },
      { id: "plans", label: "Subscription Plans", icon: Ticket },
    ] : []),
    { id: "users", label: "Users", icon: Users },
    { id: "marketplaces", label: "Marketplaces", icon: Store },
    { id: "listings", label: "Listings & Requests", icon: Layers },
  ];

  const doCopy = (key, text) => { navigator.clipboard.writeText(text); setCopied(p => ({ ...p, [key]: true })); setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 1500); };

  const { data: allListings = [], isLoading } = useQuery({ queryKey: ["allListings"], queryFn: () => base44.entities.SaaSListing.list() });
  const { data: allBids = [] } = useQuery({ queryKey: ["allBids"], queryFn: () => base44.entities.Bid.filter({}, ["-created_date"], 100) });
  const { data: allUsers = [] } = useQuery({ queryKey: ["allUsers"], queryFn: () => base44.entities.User.list() });
  const { data: allTransactions = [] } = useQuery({ queryKey: ["allTransactions"], queryFn: () => base44.entities.Transaction.filter({}, ["-created_date"], 100) });
  const { data: allReservations = [] } = useQuery({ queryKey: ["allReservations"], queryFn: () => base44.entities.DealReservations.list("-created_date", 100) });
  const { data: allAcquisitions = [] } = useQuery({ queryKey: ["allAcquisitions"], queryFn: () => base44.entities.AcquisitionRequests.list("-created_date", 100) });
  const { data: allBidRequests = [] } = useQuery({ queryKey: ["allBidRequests"], queryFn: () => base44.entities.BidRequests.list("-created_date", 100) });

  const enrichedBids = useMemo(() => {
    const lm = {}; allListings.forEach(l => lm[l.id] = l.softwareName || "Unknown");
    const um = {}; allUsers.forEach(u => um[u.id] = u.full_name || u.email);
    return allBids.map(b => ({ ...b, listingTitle: lm[b.listingId] || "Unknown", bidderName: um[b.userId] || "Unknown" }));
  }, [allBids, allListings, allUsers]);

  const pendingListings = allListings.filter(l => l.status === "pending");
  const auctionListings = allListings.filter(l => l.status === "auction");
  const rejectedListings = allListings.filter(l => l.status === "rejected");

  const auctionListingsWithBids = useMemo(() => {
    return auctionListings.map(l => ({
      ...l,
      bids: enrichedBids.filter(b => b.listingId === l.id).sort((a, b) => b.bidAmount - a.bidAmount),
      highestBid: enrichedBids.filter(b => b.listingId === l.id).reduce((max, b) => Math.max(max, b.bidAmount), 0),
    }));
  }, [auctionListings, enrichedBids]);

  const stats = [
    { icon: Store, label: "Total Listings", value: allListings.length, color: "from-violet-500 to-purple-500" },
    { icon: Gavel, label: "Active Auctions", value: auctionListings.length, color: "from-amber-500 to-orange-500" },
    { icon: Clock, label: "Pending", value: pendingListings.length, color: "from-cyan-500 to-teal-500" },
    { icon: Ban, label: "Rejected", value: rejectedListings.length, color: "from-red-500 to-rose-500" },
  ];

  const handleApprove = async (l) => { await base44.entities.SaaSListing.update(l.id, { status: "active" }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.title}" approved`); };
  const handleStartAuction = async (l) => { const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); await base44.entities.SaaSListing.update(l.id, { status: "auction", auctionEndsAt: endDate }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.title}" is now live on auction - 7 days`); };
  const handleReject = async (l) => { await base44.entities.SaaSListing.update(l.id, { status: "rejected" }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.title}" rejected`); };
  const handleDelete = async (l) => { await base44.entities.SaaSListing.delete(l.id); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.title}" deleted`); };
  const openEdit = (l) => { setEditListing(l); setEditForm({ title: l.title, category: l.category, fullPrice: l.fullPrice, sharePrice: l.sharePrice, monthlyRevenue: l.monthlyRevenue, monthlyExpenses: l.monthlyExpenses, description: l.description || "", auctionEndsAt: l.auctionEndsAt || "" }); };
  const handleEditSave = async () => {
    if (!editListing) return;
    await base44.entities.SaaSListing.update(editListing.id, { ...editForm, fullPrice: parseFloat(editForm.fullPrice) || 0, sharePrice: parseFloat(editForm.sharePrice) || 0, monthlyRevenue: parseFloat(editForm.monthlyRevenue) || 0, monthlyExpenses: parseFloat(editForm.monthlyExpenses) || 0 });
    queryClient.invalidateQueries({ queryKey: ["allListings"] }); setEditListing(null); toast.success("Listing updated");
  };

  const openBidEdit = (b) => { setEditBid(b); setEditBidForm({ bidAmount: b.bidAmount, autoBid: b.autoBid, maxAutoBid: b.maxAutoBid || "" }); };
  const handleBidEditSave = async () => {
    if (!editBid) return;
    await base44.entities.Bid.update(editBid.id, { bidAmount: parseFloat(editBidForm.bidAmount) || 0, autoBid: editBidForm.autoBid, maxAutoBid: editBidForm.maxAutoBid ? parseFloat(editBidForm.maxAutoBid) : null });
    queryClient.invalidateQueries({ queryKey: ["allBids"] }); setEditBid(null); toast.success("Bid updated");
  };
  const handleBidDelete = async (b) => { await base44.entities.Bid.delete(b.id); queryClient.invalidateQueries({ queryKey: ["allBids"] }); toast.success("Bid deleted"); };

  const handleReservationAction = async (r, status) => {
    await base44.entities.DealReservations.update(r.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    toast.success(`Reservation ${status}`);
    try { await base44.functions.invoke("notifyUserApproval", { userEmail: r.userEmail, userName: r.userName, listingTitle: r.listingTitle, requestType: "reserve_spot", status, listingId: r.listingId, userId: r.userId, phone: r.phone, budget: r.budget, message: r.message }); } catch (e) {}
  };
  const handleReservationDelete = async (r) => { await base44.entities.DealReservations.delete(r.id); queryClient.invalidateQueries({ queryKey: ["allReservations"] }); toast.success("Reservation deleted"); };

  const handleAcquisitionAction = async (a, status) => {
    await base44.entities.AcquisitionRequests.update(a.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] });
    toast.success(`Request ${status}`);
    try { await base44.functions.invoke("notifyUserApproval", { userEmail: a.userEmail, userName: a.userName, listingTitle: a.listingTitle, requestType: "acquisition_request", status, listingId: a.listingId, userId: a.userId, phone: a.phone, offerAmount: a.offerAmount, notes: a.notes }); } catch (e) {}
  };
  const handleAcquisitionDelete = async (a) => { await base44.entities.AcquisitionRequests.delete(a.id); queryClient.invalidateQueries({ queryKey: ["allAcquisitions"] }); toast.success("Acquisition request deleted"); };

  const handleBidRequestAction = async (br, status) => {
    await base44.entities.BidRequests.update(br.id, { status });
    queryClient.invalidateQueries({ queryKey: ["allBidRequests"] });
    toast.success(`Bid request ${status}`);
    try { await base44.functions.invoke("notifyBidStatus", { userId: br.userId, userEmail: br.userEmail, userName: br.userName, listingTitle: br.listingTitle, listingId: br.listingId, requestType: "bid_request", status, requestId: br.id, bidAmount: br.bidAmount }); } catch (e) {}
  };
  const handleBidRequestDelete = async (br) => { await base44.entities.BidRequests.delete(br.id); queryClient.invalidateQueries({ queryKey: ["allBidRequests"] }); toast.success("Bid request deleted"); };

  const statusBadge = (s) => {
    const c = { pending: "bg-amber-500/10 text-amber-400 border-amber-500/20", approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", rejected: "bg-red-500/10 text-red-400 border-red-500/20", contacted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", cancelled: "bg-muted text-muted-foreground border-border/30", deal_in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20", deal_closed: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
    const l = { deal_in_progress: "In Progress", deal_closed: "Closed" };
    return <Badge className={`text-[10px] border ${c[s] || c.pending}`}>{l[s] || s}</Badge>;
  };

  const listingContent = (
    <>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5 text-white" /></div>
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
            <CardTitle className="text-base font-display flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" />Pending Approvals<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{pendingListings.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">
            {pendingListings.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No pending listings</p> : pendingListings.map(l => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><Store className="w-4 h-4 text-violet-400" /></div>
                  <div><p className="text-sm font-medium">{l.title}</p><p className="text-[11px] text-muted-foreground">{l.sellerName || "Unknown"} · {l.category} · ${l.fullPrice?.toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p></div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="text-muted-foreground hover:text-foreground h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleApprove(l)} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 text-xs"><CheckCircle className="w-3.5 h-3.5 mr-1" />Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleStartAuction(l)} className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 text-xs"><Gavel className="w-3.5 h-3.5 mr-1" />Auction</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(l)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"><Ban className="w-3.5 h-3.5 mr-1" />Reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Spot Reservations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-display flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-violet-400" />Spot Reservations<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allReservations.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allReservations.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No reservations yet</p> : allReservations.map(r => (
              <div key={r.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{r.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{r.userEmail}</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      {r.userEmail && <><a href={`mailto:${r.userEmail}`} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground"><Mail className="w-3 h-3" /></a><button onClick={() => doCopy(`re-${r.id}`, r.userEmail)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground">{copied[`re-${r.id}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}</button></>}
                    </div>
                  </div>
                  <p className="text-xs text-violet-400">{r.listingTitle || "Unknown Listing"}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {r.budget > 0 && <span className="text-[11px] text-amber-400 flex items-center gap-1"><DollarSign className="w-3 h-3" />${r.budget?.toLocaleString()}</span>}
                    {statusBadge(r.status)}
                    <span className="text-[10px] text-muted-foreground">{new Date(r.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  {r.message && <div className="flex items-start gap-1 text-[11px] text-muted-foreground"><MessageSquare className="w-3 h-3 mt-0.5 shrink-0" /><span className="line-clamp-2">{r.message}</span></div>}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {r.status === "pending" && <><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "approved")} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "rejected")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" />Reject</Button></>}
                  {r.status === "approved" && <><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "deal_in_progress")} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 text-[11px]"><TrendingUp className="w-3 h-3 mr-1" />In Progress</Button></>}
                  {r.status === "contacted" && <><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "deal_in_progress")} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 text-[11px]"><TrendingUp className="w-3 h-3 mr-1" />In Progress</Button><Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "deal_closed")} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 text-[11px]"><BadgeCheck className="w-3 h-3 mr-1" />Close Deal</Button></>}
                  {r.status === "deal_in_progress" && <Button size="sm" variant="ghost" onClick={() => handleReservationAction(r, "deal_closed")} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 text-[11px]"><BadgeCheck className="w-3 h-3 mr-1" />Close Deal</Button>}
                  <Button size="sm" variant="ghost" onClick={() => handleReservationDelete(r)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Acquisition Requests */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-display flex items-center gap-2"><Building2 className="w-4 h-4 text-violet-400" />Acquisition Requests<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allAcquisitions.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allAcquisitions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No acquisition requests yet</p> : allAcquisitions.map(a => (
              <div key={a.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{a.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{a.userEmail}</span>
                    <div className="flex items-center gap-0.5 ml-1">{a.userEmail && <><a href={`mailto:${a.userEmail}`} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground"><Mail className="w-3 h-3" /></a><button onClick={() => doCopy(`ae-${a.id}`, a.userEmail)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground">{copied[`ae-${a.id}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}</button></>}</div>
                  </div>
                  <p className="text-xs text-violet-400">{a.listingTitle || "Unknown Listing"}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {a.offerAmount > 0 && <span className="text-[11px] text-amber-400 flex items-center gap-1"><DollarSign className="w-3 h-3" />${a.offerAmount?.toLocaleString()}</span>}
                    {statusBadge(a.status)}
                    <span className="text-[10px] text-muted-foreground">{new Date(a.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  {a.notes && <div className="flex items-start gap-1 text-[11px] text-muted-foreground"><MessageSquare className="w-3 h-3 mt-0.5 shrink-0" /><span className="line-clamp-2">{a.notes}</span></div>}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {a.status === "pending" && <><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "approved")} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "rejected")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" />Reject</Button></>}
                  {a.status === "approved" && <><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "deal_in_progress")} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 text-[11px]"><TrendingUp className="w-3 h-3 mr-1" />In Progress</Button></>}
                  {a.status === "contacted" && <><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "deal_in_progress")} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 text-[11px]"><TrendingUp className="w-3 h-3 mr-1" />In Progress</Button><Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "deal_closed")} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 text-[11px]"><BadgeCheck className="w-3 h-3 mr-1" />Close Deal</Button></>}
                  {a.status === "deal_in_progress" && <Button size="sm" variant="ghost" onClick={() => handleAcquisitionAction(a, "deal_closed")} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 text-[11px]"><BadgeCheck className="w-3 h-3 mr-1" />Close Deal</Button>}
                  <Button size="sm" variant="ghost" onClick={() => handleAcquisitionDelete(a)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bid Requests */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" />Bid Requests<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{allBidRequests.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allBidRequests.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No bid requests yet</p> : allBidRequests.map(br => (
              <div key={br.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{br.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{br.userEmail}</span>
                  </div>
                  <p className="text-xs text-violet-400">{br.listingTitle || "Unknown Listing"}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {br.bidAmount > 0 && <span className="text-[11px] text-amber-400 flex items-center gap-1"><DollarSign className="w-3 h-3" />${br.bidAmount?.toLocaleString()}</span>}
                    {statusBadge(br.status)}
                    <span className="text-[10px] text-muted-foreground">{new Date(br.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {br.status === "pending" && <><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "approved")} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "contacted")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "rejected")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" />Reject</Button></>}
                  <Button size="sm" variant="ghost" onClick={() => handleBidRequestDelete(br)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* All Bids */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" />All Bids<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{enrichedBids.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {enrichedBids.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No bids yet</p> : enrichedBids.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1"><div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Gavel className="w-4 h-4 text-amber-400" /></div><div className="min-w-0"><p className="text-sm font-medium truncate">{b.bidderName}</p><p className="text-[11px] text-muted-foreground truncate">{b.listingTitle} · {new Date(b.created_date).toLocaleDateString()}</p></div></div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-display font-bold text-amber-400">${b.bidAmount?.toLocaleString()}</span>
                  <Button size="sm" variant="ghost" onClick={() => openBidEdit(b)} className="h-7 text-[11px] text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleBidDelete(b)} className="h-7 text-[11px] text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Auctions */}
      {auctionListingsWithBids.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" />Active Auctions<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">{auctionListingsWithBids.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/30">
              {auctionListingsWithBids.map(l => (
                <div key={l.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Gavel className="w-4 h-4 text-amber-400" /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{l.softwareName || "Untitled"}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">Ends {l.auctionEndsAt ? new Date(l.auctionEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                          {l.highestBid > 0 && <span className="text-[11px] text-amber-400 font-bold">Top: ${l.highestBid.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="h-7 text-[11px] text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3 mr-1" />Listing</Button>
                    </div>
                  </div>
                  {l.bids.length > 0 && (
                    <div className="ml-12 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-medium">Bids ({l.bids.length})</p>
                      {l.bids.map(b => (
                        <div key={b.id} className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-1.5">
                          <span className="text-xs font-medium text-foreground flex-1 truncate">{b.bidderName}</span>
                          <span className="text-xs font-display font-bold text-amber-400">${b.bidAmount?.toLocaleString()}</span>
                          {b.autoBid && <Badge className="text-[8px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Auto</Badge>}
                          <Button size="sm" variant="ghost" onClick={() => openBidEdit(b)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleBidDelete(b)} className="h-6 w-6 p-0 text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-display flex items-center gap-2"><Receipt className="w-4 h-4 text-violet-400" />Transaction History<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allTransactions.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allTransactions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p> : allTransactions.slice(0, 30).map(t => {
              const isPos = t.amount > 0;
              const tl = { share_purchase: "Share Purchase", full_ownership_purchase: "Full Ownership", deposit: "Deposit", withdrawal: "Withdrawal", dividend: "Dividend", sale_revenue: "Sale Revenue" }[t.type] || t.type;
              return (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center"><ArrowDownRight className={`w-4 h-4 ${isPos ? "text-emerald-400" : "text-red-400"}`} /></div>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{tl}</p>{t.userName && <p className="text-xs text-violet-400">{t.userName}</p>}</div><div className="flex items-center gap-2 mt-0.5 flex-wrap">{t.listingTitle && <span className="text-[10px] text-muted-foreground">{t.listingTitle}</span>}<Badge className={`text-[10px] border ${t.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{t.status}</Badge><span className="text-[10px] text-muted-foreground">{new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div></div>
                  </div>
                  <span className={`text-sm font-display font-bold shrink-0 ${isPos ? "text-emerald-400" : "text-red-400"}`}>{isPos ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* All Listings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Store className="w-4 h-4 text-violet-400" />All Listings<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{allListings.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {allListings.map(l => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center"><Store className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-sm font-medium">{l.title}</p><p className="text-[11px] text-muted-foreground">{l.category} · ${l.fullPrice?.toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p></div></div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border ${l.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : l.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : l.status === "auction" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{l.status}</Badge>
                  {l.status !== "auction" && <Button size="sm" variant="ghost" onClick={() => handleStartAuction(l)} className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"><Gavel className="w-3.5 h-3.5 mr-1" />Auction</Button>}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-red-400/60 hover:text-red-400 h-8 text-xs"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <QnAManager />
      <ChatMonitor />
      <DividendPanel />
    </>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-display font-bold">Admin Panel</h1><p className="text-sm text-muted-foreground mt-1">Manage listings and platform operations.</p></div>
        </div>
        <div className="flex gap-2 flex-wrap mt-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><Icon className="w-4 h-4" />{tab.label}</button>;
          })}
        </div>
      </motion.div>

      {activeTab === "platform" && <PlatformOverview />}
      {activeTab === "plans" && <PlanManager />}
      {activeTab === "users" && <UserManager />}
      {activeTab === "marketplaces" && <MarketplaceManager />}
      {activeTab === "listings" && listingContent}

      {/* Edit Listing Modal */}
      <Dialog open={!!editListing} onOpenChange={() => setEditListing(null)}>
        <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Edit Listing</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Title</label><Input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Full Price</label><Input type="number" value={editForm.fullPrice || ""} onChange={e => setEditForm(f => ({ ...f, fullPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Share Price</label><Input type="number" value={editForm.sharePrice || ""} onChange={e => setEditForm(f => ({ ...f, sharePrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Monthly Revenue</label><Input type="number" value={editForm.monthlyRevenue || ""} onChange={e => setEditForm(f => ({ ...f, monthlyRevenue: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Monthly Expenses</label><Input type="number" value={editForm.monthlyExpenses || ""} onChange={e => setEditForm(f => ({ ...f, monthlyExpenses: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Description</label><Input value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Auction End Date (ISO)</label><Input value={editForm.auctionEndsAt || ""} onChange={e => setEditForm(f => ({ ...f, auctionEndsAt: e.target.value }))} placeholder="2026-06-20T00:00:00.000Z" className="bg-secondary/50 border-border/30 rounded-xl mt-1 text-xs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bid Modal */}
      <Dialog open={!!editBid} onOpenChange={() => setEditBid(null)}>
        <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" />Edit Bid</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editBid && <p className="text-xs text-muted-foreground">Bidder: <span className="text-foreground">{editBid.bidderName}</span> · Listing: <span className="text-violet-400">{editBid.listingTitle}</span></p>}
            <div><label className="text-xs text-muted-foreground">Bid Amount ($)</label><Input type="number" value={editBidForm.bidAmount || ""} onChange={e => setEditBidForm(f => ({ ...f, bidAmount: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
            <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={editBidForm.autoBid || false} onChange={e => setEditBidForm(f => ({ ...f, autoBid: e.target.checked }))} className="rounded accent-amber-500" />
                <span className="text-muted-foreground">Auto Bid</span>
              </label>
              {editBidForm.autoBid && <div className="flex-1 ml-2"><Input type="number" placeholder="Max auto-bid" value={editBidForm.maxAutoBid || ""} onChange={e => setEditBidForm(f => ({ ...f, maxAutoBid: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl text-xs h-8" /></div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBid(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleBidEditSave} className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl">Save Bid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}