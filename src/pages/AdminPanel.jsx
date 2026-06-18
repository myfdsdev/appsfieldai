import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Store, Gavel, Clock, CheckCircle, Ban, Trash2, Pencil, Receipt, ArrowDownRight, CalendarCheck, Building2, Phone, MessageSquare, DollarSign, TrendingUp, BadgeCheck, Mail, Copy, Check, Globe, Ticket, Layers, RefreshCw, Crown, Zap, CreditCard, ShoppingBag, Webhook, Image, Bell, Settings, Smartphone, UserPlus, ShieldCheck, FileText, Star, FileCode, Bot, Sparkles, Workflow, AtSign, FileStack, ContactRound, Calendar } from "lucide-react";
import DividendPanel from "@/components/admin/DividendPanel";
import QnAManager from "@/components/admin/QnAManager";
import ChatMonitor from "@/components/admin/ChatMonitor";
import PlatformOverview from "@/components/admin/PlatformOverview";
import PlanManager from "@/components/admin/PlanManager";
import UserManager from "@/components/admin/UserManager";
import MarketplaceManager from "@/components/admin/MarketplaceManager";
import DashboardEditor from "@/components/admin/DashboardEditor";
import AdminTopNav from "@/components/admin/AdminTopNav";
import HookManagement from "@/components/admin/HookManagement";
import ReservationsManager from "@/components/marketplace/ReservationsManager";
import AcquisitionsRequestsManager from "@/components/marketplace/AcquisitionRequestsManager";
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
  const [activeTab, setActiveTab] = useState("users");

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const doCopy = (key, text) => { navigator.clipboard.writeText(text); setCopied(p => ({ ...p, [key]: true })); setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 1500); };

  const { data: allListings = [], isLoading } = useQuery({ queryKey: ["allListings"], queryFn: () => base44.entities.SaaSListing.list() });
  const { data: allBids = [] } = useQuery({ queryKey: ["allBids"], queryFn: () => base44.entities.Bid.filter({}, ["-created_date"], 100) });
  const { data: allUsers = [] } = useQuery({ queryKey: ["allUsers"], queryFn: () => base44.entities.User.list() });
  const { data: allTransactions = [] } = useQuery({ queryKey: ["allTransactions"], queryFn: () => base44.entities.Transaction.filter({}, ["-created_date"], 100) });
  const { data: allReservations = [] } = useQuery({ queryKey: ["allReservations"], queryFn: () => base44.entities.DealReservations.list("-created_date", 100) });
  const { data: allAcquisitions = [] } = useQuery({ queryKey: ["allAcquisitions"], queryFn: () => base44.entities.AcquisitionRequests.list("-created_date", 100) });
  const { data: allBidRequests = [] } = useQuery({ queryKey: ["allBidRequests"], queryFn: () => base44.entities.BidRequests.list("-created_date", 100) });

  const enrichedBids = useMemo(() => {
    const lm = {}; allListings.forEach(l => lm[l.id] = l.softwareName || "Untitled");
    const um = {}; allUsers.forEach(u => um[u.id] = u.full_name || u.email);
    return allBids.map(b => ({ ...b, listingTitle: lm[b.listingId] || "Unknown", bidderName: um[b.userId] || "Unknown" }));
  }, [allBids, allListings, allUsers]);

  const enrichedBidRequests = useMemo(() => {
    const lm = {}; allListings.forEach(l => lm[l.id] = l);
    return allBidRequests.map(br => ({
      ...br,
      listingTitle: br.listingTitle || lm[br.listingId]?.softwareName || lm[br.listingId]?.name || "Untitled Listing",
    }));
  }, [allBidRequests, allListings]);

  const pendingListings = allListings.filter(l => l.status === "pending");
  const auctionListings = allListings.filter(l => l.status === "auction");
  const rejectedListings = allListings.filter(l => l.status === "rejected");
  const activeListings = allListings.filter(l => l.status === "active");
  const activeUsers = allUsers.filter(u => u.role !== "super_admin");

  const stats = [
    { icon: Users, label: "Total Users", value: allUsers.length, color: "from-violet-500 to-purple-500", iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
    { icon: Globe, label: "Active Users", value: activeUsers.length, color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { icon: Store, label: "Total Listings", value: allListings.length, color: "from-cyan-500 to-blue-500", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400" },
    { icon: Gavel, label: "Active Auctions", value: auctionListings.length, color: "from-amber-500 to-orange-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success("Data refreshed");
  };

  const handleApprove = async (l) => { await base44.entities.SaaSListing.update(l.id, { status: "active" }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.softwareName || "Untitled"}" approved`); };
  const handleStartAuction = async (l) => { const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); await base44.entities.SaaSListing.update(l.id, { status: "auction", auctionEndsAt: endDate }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.softwareName || "Untitled"}" is now live on auction - 7 days`); };
  const handleReject = async (l) => { await base44.entities.SaaSListing.update(l.id, { status: "rejected" }); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.softwareName || "Untitled"}" rejected`); };
  const handleDelete = async (l) => { await base44.entities.SaaSListing.delete(l.id); queryClient.invalidateQueries({ queryKey: ["allListings"] }); toast.success(`"${l.softwareName || "Untitled"}" deleted`); };
  const openEdit = (l) => { setEditListing(l); setEditForm({ softwareName: l.softwareName || "", category: l.category || "", sharePrice: l.sharePrice || 0, totalShares: l.totalShares || 0, monthlyRevenue: l.monthlyRevenue || 0, monthlyExpenses: l.monthlyExpenses || 0, growthRate: l.growthRate || 0, shortDescription: l.shortDescription || "", fullDescription: l.fullDescription || "", auctionEndsAt: l.auctionEndsAt || "", status: l.status || "pending", features: l.features || [], rating: l.rating || 5 }); };
  const handleEditSave = async () => {
    if (!editListing) return;
    await base44.entities.SaaSListing.update(editListing.id, { ...editForm, sharePrice: parseFloat(editForm.sharePrice) || 0, totalShares: parseInt(editForm.totalShares) || 0, monthlyRevenue: parseFloat(editForm.monthlyRevenue) || 0, monthlyExpenses: parseFloat(editForm.monthlyExpenses) || 0, growthRate: parseFloat(editForm.growthRate) || 0, rating: parseFloat(editForm.rating) || 5 });
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

  // ── Content & Media ──
  const contentMediaContent = (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Clock className="w-4 h-4 text-amber-400" />Pending Approvals<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{pendingListings.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/20">
            {pendingListings.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No pending listings</p> : pendingListings.map(l => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center"><Store className="w-4 h-4 text-violet-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">{l.softwareName || "Untitled"}</p><p className="text-[11px] text-muted-foreground">{l.sellerName || "Unknown"} · {l.category} · ${((l.sharePrice || 0) * (l.totalShares || 0)).toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p></div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Store className="w-4 h-4 text-violet-400" />All Listings<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allListings.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
            {allListings.map(l => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center"><Store className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-sm font-medium text-foreground">{l.softwareName || "Untitled"}</p><p className="text-[11px] text-muted-foreground">{l.category} · ${((l.sharePrice || 0) * (l.totalShares || 0)).toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p></div></div>
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
    </>
  );

  // ── Comms & Mailing ──
  const commsContent = (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><CalendarCheck className="w-4 h-4 text-violet-400" />Spot Reservations<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allReservations.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
            {allReservations.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No reservations yet</p> : allReservations.map(r => (
              <div key={r.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{r.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{r.userEmail}</span>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Building2 className="w-4 h-4 text-violet-400" />Acquisition Requests<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allAcquisitions.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
            {allAcquisitions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No acquisition requests yet</p> : allAcquisitions.map(a => (
              <div key={a.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{a.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{a.userEmail}</span>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Gavel className="w-4 h-4 text-amber-400" />Bid Requests<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{enrichedBidRequests.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
          {enrichedBidRequests.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No bid requests yet</p> : enrichedBidRequests.map(br => (
              <div key={br.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{br.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{br.userEmail}</span>
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
      <ChatMonitor />
    </>
  );

  // ── System & Config ──
  const systemContent = (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Gavel className="w-4 h-4 text-amber-400" />Live Auctions<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{auctionListings.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/20">
            {auctionListings.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No active auctions</p> : auctionListings.map(l => {
              const fullVal = ((l.sharePrice || 0) * (l.totalShares || 0));
              return (
                <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${l.imageGradient || 'from-amber-600 to-orange-600'} flex items-center justify-center`}><Gavel className="w-5 h-5 text-white" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{l.softwareName || "Untitled"}</p>
                      <p className="text-[11px] text-muted-foreground">{l.category} · ${fullVal.toLocaleString()} valuation · {l.soldShares || 0}/{l.totalShares || 0} shares · +{l.growthRate || 0}% growth</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-xs font-display font-bold text-amber-400">${l.sharePrice || 0}/share</p>
                      <p className="text-[10px] text-muted-foreground">{l.auctionEndsAt ? new Date(l.auctionEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No end date"}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="h-8 text-xs text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleApprove(l)} className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"><CheckCircle className="w-3.5 h-3.5 mr-1" />End Auction</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="h-8 text-xs text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Gavel className="w-4 h-4 text-amber-400" />All Bids<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{enrichedBids.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
            {enrichedBids.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No bids yet</p> : enrichedBids.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1"><div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Gavel className="w-4 h-4 text-amber-400" /></div><div className="min-w-0"><p className="text-sm font-medium truncate text-foreground">{b.bidderName}</p><p className="text-[11px] text-muted-foreground truncate">{b.listingTitle} · {new Date(b.created_date).toLocaleDateString()}</p></div></div>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Receipt className="w-4 h-4 text-violet-400" />Transaction History<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allTransactions.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/20">
            {allTransactions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p> : allTransactions.slice(0, 30).map(t => {
              const isPos = t.amount > 0;
              const tl = { share_purchase: "Share Purchase", full_ownership_purchase: "Full Ownership", deposit: "Deposit", withdrawal: "Withdrawal", dividend: "Dividend", sale_revenue: "Sale Revenue" }[t.type] || t.type;
              return (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center"><ArrowDownRight className={`w-4 h-4 ${isPos ? "text-emerald-400" : "text-red-400"}`} /></div>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium text-foreground">{tl}</p>{t.userName && <p className="text-xs text-violet-400">{t.userName}</p>}</div><div className="flex items-center gap-2 mt-0.5 flex-wrap">{t.listingTitle && <span className="text-[10px] text-muted-foreground">{t.listingTitle}</span>}<Badge className={`text-[10px] border ${t.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{t.status}</Badge><span className="text-[10px] text-muted-foreground">{new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div></div>
                  </div>
                  <span className={`text-sm font-display font-bold shrink-0 ${isPos ? "text-emerald-400" : "text-red-400"}`}>{isPos ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
      <DividendPanel />
    </>
  );

  // ── AI & Engine ──
  const aiContent = (
    <>
      <QnAManager />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><RefreshCw className="w-4 h-4 text-cyan-400" />AI & Automation</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">AI-powered features, auto-bidding engine, and smart notifications are active.</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Auto-Bid</Badge>
              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[11px]">AI Scoring</Badge>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[11px]">Notifications</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );



  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <UserManager />
          </motion.div>
        );
      case "invite":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <UserPlus className="w-4 h-4 text-violet-400" />Invite User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Invite new users to the platform. User invitations are managed from the <span className="text-foreground font-medium">Users</span> section.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "roles":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />Roles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage user roles (admin, user, vendor) and permissions. Role assignments are handled in the <span className="text-foreground font-medium">Users</span> section.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "access_logs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4 text-cyan-400" />Access Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Access logs tracking coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "content":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Store className="w-4 h-4 text-violet-400" />All Listings<Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-2">{allListings.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/20">
                {allListings.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No listings yet</p> : allListings.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center"><Store className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-sm font-medium text-foreground">{l.softwareName || "Untitled"}</p><p className="text-[11px] text-muted-foreground">{l.category} · ${((l.sharePrice || 0) * (l.totalShares || 0)).toLocaleString()} · {new Date(l.created_date).toLocaleDateString()}</p></div></div>
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
        );
      case "reservations":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ReservationsManager />
          </motion.div>
        );
      case "acquisitions":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AcquisitionsRequestsManager />
          </motion.div>
        );
      case "templates":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Layers className="w-4 h-4 text-cyan-400" />Templates</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground py-4 text-center">Template management coming soon.</p></CardContent>
            </Card>
          </motion.div>
        );
      case "media":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Image className="w-4 h-4 text-pink-400" />Media Library</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground py-4 text-center">Media library coming soon.</p></CardContent>
            </Card>
          </motion.div>
        );
      case "pending":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Clock className="w-4 h-4 text-amber-400" />Pending Approvals<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{pendingListings.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/20">
                {pendingListings.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No pending listings</p> : pendingListings.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center"><Store className="w-4 h-4 text-violet-400" /></div>
                      <div><p className="text-sm font-medium text-foreground">{l.softwareName || "Untitled"}</p><p className="text-[11px] text-muted-foreground">{l.sellerName || "Unknown"} · {l.category} · ${((l.sharePrice || 0) * (l.totalShares || 0)).toLocaleString()}</p></div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="text-muted-foreground hover:text-foreground h-8 text-xs"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleApprove(l)} className="text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs"><CheckCircle className="w-3.5 h-3.5 mr-1" />Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStartAuction(l)} className="text-amber-400 hover:bg-amber-500/10 h-8 text-xs"><Gavel className="w-3.5 h-3.5 mr-1" />Auction</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(l)} className="text-red-400 hover:bg-red-500/10 h-8 text-xs"><Ban className="w-3.5 h-3.5 mr-1" />Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-red-400/60 hover:bg-red-500/10 h-8 text-xs"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );
      case "comms":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Mail className="w-4 h-4 text-red-400" />Gmail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gmail OAuth is connected for email delivery. Configure sender details and SMTP settings in <span className="text-foreground font-medium">Admin Settings → Email Settings</span>.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Connected</Badge>
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[11px]">Gmail OAuth</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "smtp":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <AtSign className="w-4 h-4 text-cyan-400" />SMTP Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">SMTP server configuration for transactional emails. Manage SMTP credentials in <span className="text-foreground font-medium">Admin Settings → Email Settings</span>.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Configured</Badge>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[11px]">TLS Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "email_logs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <FileStack className="w-4 h-4 text-violet-400" />Email Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Email delivery logs coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "contact_msgs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <ContactRound className="w-4 h-4 text-amber-400" />Contact Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Contact message management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "bid_requests":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Gavel className="w-4 h-4 text-amber-400" />Bid Requests<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{enrichedBidRequests.length}</Badge></CardTitle></CardHeader>
              <CardContent className="divide-y divide-border/20">
                {enrichedBidRequests.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No bid requests yet</p> : enrichedBidRequests.map(br => (
                  <div key={br.id} className="flex items-start justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium text-foreground">{br.userName || "Unknown"}</p><span className="text-xs text-muted-foreground">{br.userEmail}</span></div>
                      <p className="text-xs text-violet-400">{br.listingTitle || "Untitled Listing"}</p>
                      <div className="flex items-center gap-3 flex-wrap">{br.bidAmount > 0 && <span className="text-[11px] text-amber-400 flex items-center gap-1"><DollarSign className="w-3 h-3" />${br.bidAmount?.toLocaleString()}</span>}{statusBadge(br.status)}</div>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                      {br.status === "pending" && <><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "approved")} className="text-emerald-400 hover:bg-emerald-500/10 h-7 text-[11px]"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "contacted")} className="text-cyan-400 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button><Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "rejected")} className="text-red-400 hover:bg-red-500/10 h-7 text-[11px]"><Ban className="w-3 h-3 mr-1" />Reject</Button></>}
                      {br.status === "approved" && <Button size="sm" variant="ghost" onClick={() => handleBidRequestAction(br, "contacted")} className="text-cyan-400 hover:bg-cyan-500/10 h-7 text-[11px]"><Phone className="w-3 h-3 mr-1" />Contacted</Button>}
                      <Button size="sm" variant="ghost" onClick={() => handleBidRequestDelete(br)} className="text-red-400/50 hover:bg-red-500/10 h-7 text-[11px]"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );
      case "leads":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Store className="w-4 h-4 text-cyan-400" />Leads</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground py-4 text-center">Leads management coming soon.</p></CardContent>
            </Card>
          </motion.div>
        );
      case "hooks":
        return <HookManagement />;
      case "mktpl_templates":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Globe className="w-4 h-4 text-cyan-400" />Marketplace Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Marketplace template management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "pricing_presets":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Star className="w-4 h-4 text-amber-400" />Pricing Presets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Pricing presets management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "email_templates":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <FileCode className="w-4 h-4 text-pink-400" />Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Email template management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "subscriptions":
      case "invoices":
      case "coupons":
      case "payments":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Ticket className="w-4 h-4 text-violet-400" />{activeTab === "subscriptions" ? "Subscriptions" : activeTab === "invoices" ? "Invoices" : activeTab === "coupons" ? "Coupons" : "Payments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">{activeTab === "subscriptions" ? "Subscription" : activeTab === "invoices" ? "Invoice" : activeTab === "coupons" ? "Coupon" : "Payment"} management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "system":
        return systemContent;
      case "app_notif":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Bell className="w-4 h-4 text-violet-400" />App Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">In-app notifications are delivered in real-time to users via the notification bell. Manage and view them from the <span className="text-foreground font-medium">Notifications</span> page.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Real-time</Badge>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[11px]">Bell System Active</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "email_notif":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Mail className="w-4 h-4 text-cyan-400" />Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Transactional emails (approvals, rejections, deal updates) are sent automatically. Configure sender details in <span className="text-foreground font-medium">Admin Settings → Email Settings</span>.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Active</Badge>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[11px]">Gmail Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "push_notif":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Smartphone className="w-4 h-4 text-amber-400" />Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Push notification support coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "notif_settings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Settings className="w-4 h-4 text-muted-foreground" />Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification preferences and triggers are configured per-event. Email and in-app notifications fire automatically on listing submissions, approvals, bid updates, and deal status changes.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Auto-trigger On</Badge>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[11px]">Per-event Rules</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "email_settings": case "payment_settings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Mail className="w-4 h-4 text-cyan-400" />{activeTab === "email_settings" ? "Email Settings" : "Payment Settings"}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground py-4 text-center">Configure in <span className="text-foreground font-medium">Admin Settings</span> page.</p></CardContent>
            </Card>
          </motion.div>
        );
      case "dashboard":
      case "hero_background":
        return (
          <div className="space-y-5">
            <PlatformOverview />
            <DashboardEditor />
          </div>
        );
      case "ai":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Bot className="w-4 h-4 text-violet-400" />AI Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">AI-powered agent assistance for marketplace operations. Configure AI agents from the platform dashboard.</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Active</Badge>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[11px]">LLM Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "qna_db":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <QnAManager />
          </motion.div>
        );
      case "ai_recs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Sparkles className="w-4 h-4 text-amber-400" />AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">AI-powered product recommendations coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "automation":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
                  <Workflow className="w-4 h-4 text-cyan-400" />Automation Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-4 text-center">Automation rules management coming soon.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "chat_monitor":
      case "analytics":
        return aiContent;
      case "stripe_int": case "razorpay_int": case "gmail_int": case "jvzoo_int": case "webhooks_int":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Zap className="w-4 h-4 text-orange-400" />Integrations</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground py-4 text-center">Integration settings are managed via <span className="text-foreground font-medium">Admin Settings</span> and the platform dashboard.</p></CardContent>
            </Card>
          </motion.div>
        );
      case "int_stripe":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><CreditCard className="w-4 h-4 text-emerald-400" />Stripe Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">Stripe Payments</p><p className="text-xs text-muted-foreground">Configure Stripe API keys and webhook settings</p></div>
                  <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="text-xs text-muted-foreground">Publishable Key</label><Input placeholder="pk_live_..." className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" readOnly value="pk_••••••••••••••••" /></div>
                  <div><label className="text-xs text-muted-foreground">Secret Key</label><Input placeholder="sk_live_..." className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" readOnly value="sk_••••••••••••••••" /></div>
                  <div><label className="text-xs text-muted-foreground">Webhook Secret</label><Input placeholder="whsec_..." className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" readOnly value="whsec_••••••••••••" /></div>
                </div>
                <p className="text-xs text-muted-foreground">To update Stripe keys, go to <span className="text-foreground font-medium">Admin Settings → Payment Settings</span>.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "int_razorpay":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Zap className="w-4 h-4 text-blue-400" />Razorpay Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Zap className="w-4 h-4 text-blue-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">Razorpay Payments</p><p className="text-xs text-muted-foreground">Accept INR and international payments via Razorpay</p></div>
                  <Badge className="ml-auto bg-secondary text-muted-foreground border-border/30 text-[10px]">Not Connected</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="text-xs text-muted-foreground">Key ID</label><Input placeholder="rzp_live_..." className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                  <div><label className="text-xs text-muted-foreground">Key Secret</label><Input type="password" placeholder="Your Razorpay secret" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl text-xs">Connect Razorpay</Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "int_gmail":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Mail className="w-4 h-4 text-red-400" />Gmail / SMTP Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><Mail className="w-4 h-4 text-red-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">Email Delivery</p><p className="text-xs text-muted-foreground">Configure Gmail OAuth or custom SMTP server</p></div>
                  <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Connected</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="text-xs text-muted-foreground">SMTP Host</label><Input placeholder="smtp.gmail.com" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted-foreground">Port</label><Input placeholder="587" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                    <div><label className="text-xs text-muted-foreground">Encryption</label><Input placeholder="TLS" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                  </div>
                  <div><label className="text-xs text-muted-foreground">From Email</label><Input placeholder="noreply@yourdomain.com" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                </div>
                <p className="text-xs text-muted-foreground">Gmail OAuth is managed via <span className="text-foreground font-medium">Admin Settings → Email Settings</span>.</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "int_jvzoo":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><ShoppingBag className="w-4 h-4 text-amber-400" />JVZoo Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-amber-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">JVZoo Marketplace</p><p className="text-xs text-muted-foreground">Sync products and affiliates from JVZoo</p></div>
                  <Badge className="ml-auto bg-secondary text-muted-foreground border-border/30 text-[10px]">Not Connected</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="text-xs text-muted-foreground">API Key</label><Input placeholder="Your JVZoo API key" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                  <div><label className="text-xs text-muted-foreground">Secret Key</label><Input type="password" placeholder="Your JVZoo secret" className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 rounded-xl text-xs">Connect JVZoo</Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "int_webhooks":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-[#1a1a1a]">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-display flex items-center gap-2 text-foreground"><Webhook className="w-4 h-4 text-violet-400" />Webhooks</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center"><Webhook className="w-4 h-4 text-violet-400" /></div>
                  <div><p className="text-sm font-medium text-foreground">Webhook Endpoints</p><p className="text-xs text-muted-foreground">Register and manage outgoing webhook URLs</p></div>
                </div>
                <div className="divide-y divide-border/20">
                  {[
                    { event: "listing.approved", url: "/api/webhooks/listing", status: "active" },
                    { event: "order.completed",  url: "/api/webhooks/order",   status: "active" },
                    { event: "user.registered",  url: "/api/webhooks/user",    status: "inactive" },
                  ].map((wh, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-xs font-medium text-foreground">{wh.event}</p>
                        <p className="text-[11px] text-muted-foreground">{wh.url}</p>
                      </div>
                      <Badge className={`text-[10px] ${wh.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-secondary text-muted-foreground border-border/30"}`}>{wh.status}</Badge>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="border-border/40 rounded-xl text-xs w-full">+ Add Webhook Endpoint</Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      default:
        return <UserManager />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Master Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage users, plans, and system settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl h-9 text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1a1a] border border-border/30">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">Welcome, <span className="text-foreground font-medium">{currentUser?.full_name || currentUser?.email || "Admin"}</span></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="bg-[#1a1a1a] border border-border/40 rounded-2xl p-5 hover:border-border/60 transition-colors">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <p className="text-3xl font-display font-bold mt-3 text-foreground">{isLoading ? "—" : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Dropdown Nav */}
      <AdminTopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
        {renderContent()}
      </motion.div>

      {/* Edit Listing Modal */}
      <Dialog open={!!editListing} onOpenChange={() => setEditListing(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-foreground">Edit Listing</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Software Name</label><Input value={editForm.softwareName || ""} onChange={e => setEditForm(f => ({ ...f, softwareName: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Category</label><Input value={editForm.category || ""} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Status</label><Input value={editForm.status || ""} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Share Price ($)</label><Input type="number" value={editForm.sharePrice || ""} onChange={e => setEditForm(f => ({ ...f, sharePrice: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Total Shares</label><Input type="number" value={editForm.totalShares || ""} onChange={e => setEditForm(f => ({ ...f, totalShares: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Monthly Revenue ($)</label><Input type="number" value={editForm.monthlyRevenue || ""} onChange={e => setEditForm(f => ({ ...f, monthlyRevenue: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Monthly Expenses ($)</label><Input type="number" value={editForm.monthlyExpenses || ""} onChange={e => setEditForm(f => ({ ...f, monthlyExpenses: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Growth Rate (%)</label><Input type="number" value={editForm.growthRate || ""} onChange={e => setEditForm(f => ({ ...f, growthRate: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Rating</label><Input type="number" step="0.1" min="1" max="5" value={editForm.rating || ""} onChange={e => setEditForm(f => ({ ...f, rating: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Short Description</label><Input value={editForm.shortDescription || ""} onChange={e => setEditForm(f => ({ ...f, shortDescription: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Auction End Date</label><Input type="datetime-local" value={editForm.auctionEndsAt ? new Date(editForm.auctionEndsAt).toISOString().slice(0, 16) : ""} onChange={e => setEditForm(f => ({ ...f, auctionEndsAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-[#d93025] hover:bg-[#c62828] rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bid Modal */}
      <Dialog open={!!editBid} onOpenChange={() => setEditBid(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2 text-foreground"><Gavel className="w-4 h-4 text-amber-400" />Edit Bid</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editBid && <p className="text-xs text-muted-foreground">Bidder: <span className="text-foreground">{editBid.bidderName}</span> · Listing: <span className="text-violet-400">{editBid.listingTitle}</span></p>}
            <div><label className="text-xs text-muted-foreground">Bid Amount ($)</label><Input type="number" value={editBidForm.bidAmount || ""} onChange={e => setEditBidForm(f => ({ ...f, bidAmount: e.target.value }))} className="bg-[#252525] border-border/30 rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBid(null)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleBidEditSave} className="bg-[#d93025] hover:bg-[#c62828] rounded-xl">Save Bid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}