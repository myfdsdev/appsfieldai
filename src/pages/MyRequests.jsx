import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ClipboardList, CalendarCheck, Building2, Clock, X, CheckCircle, Gavel,
  Ban, DollarSign, MessageSquare, Loader2, FileText, TrendingUp, BadgeCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TABS = [
  { id: "all", label: "All" },
  { id: "reserve_spot", label: "Reserve Spots" },
  { id: "acquisition_request", label: "Acquisitions" },
  { id: "bid_request", label: "Bid Requests" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
];

const statusConfig = {
  pending:          { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock, label: "Pending" },
  approved:         { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, label: "Approved" },
  rejected:         { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: Ban, label: "Rejected" },
  contacted:        { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", icon: CheckCircle, label: "Contacted" },
  cancelled:        { color: "bg-muted text-muted-foreground border-border/30", icon: X, label: "Cancelled" },
  deal_in_progress: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: TrendingUp, label: "In Progress" },
  deal_closed:      { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: BadgeCheck, label: "Closed" },
};

const STATUS_STEPS = ["pending", "approved", "contacted", "deal_in_progress", "deal_closed"];

function StatusTimeline({ currentStatus }) {
  if (currentStatus === "rejected" || currentStatus === "cancelled") {
    const cfg = statusConfig[currentStatus];
    const Icon = cfg.icon;
    return (
      <div className="mt-3 pt-3 border-t border-border/20">
        <div className={`flex items-center gap-2 text-xs ${currentStatus === "rejected" ? "text-red-400" : "text-muted-foreground"}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="font-medium">{cfg.label}</span>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
  if (currentIdx < 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      <div className="flex items-center gap-0.5">
        {STATUS_STEPS.map((step, i) => {
          const sc = statusConfig[step];
          const Icon = sc.icon;
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] transition-colors ${
                  isDone ? "bg-violet-500/20 text-violet-400" : "bg-secondary/60 text-muted-foreground"
                } ${isCurrent ? "ring-1 ring-violet-500/40" : ""}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className={`text-[9px] mt-1 whitespace-nowrap ${
                  isCurrent ? "text-violet-400 font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"
                }`}>{sc.label}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-px mb-4 ${i < currentIdx ? "bg-violet-500/40" : "bg-border/40"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function RequestCard({ item, type, onCancel, listingMap }) {
  const isSpot = type === "reserve_spot";
  const isBid = type === "bid_request";
  const amount = isSpot ? item.budget : isBid ? item.bidAmount : item.offerAmount;
  const note = isSpot ? item.message : isBid ? item.message : item.notes;
  const cfg = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  const getListingName = () => {
    if (item.listingTitle) return item.listingTitle;
    const listing = listingMap[item.listingId];
    return listing?.softwareName || listing?.name || "Untitled Listing";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl hover:border-border/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={`text-[10px] border ${isSpot ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : isBid ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                  {isSpot ? (
                    <><CalendarCheck className="w-3 h-3 mr-1" /> Reserve Spot</>
                  ) : isBid ? (
                    <><Gavel className="w-3 h-3 mr-1" /> Bid Request</>
                  ) : (
                    <><Building2 className="w-3 h-3 mr-1" /> Acquisition</>
                  )}
                </Badge>
                <Badge className={`text-[10px] border ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {cfg.label || item.status}
                </Badge>
              </div>

              <p className="text-sm font-medium text-foreground truncate mb-1.5">
                {getListingName()}
              </p>

              <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                {amount > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <DollarSign className="w-3 h-3" />
                    ${amount?.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </span>
              </div>

              {note && (
                <div className="mt-2 p-2 rounded-lg bg-secondary/40 border border-border/20">
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{note}</span>
                  </p>
                </div>
              )}
            </div>

            {item.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(item)}
                className="text-red-400/60 hover:text-red-400 h-7 text-[11px] shrink-0"
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            )}
            {item.status !== "pending" && item.status !== "cancelled" && (
              <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${
                item.status === "approved" ? "text-emerald-400" :
                item.status === "rejected" ? "text-red-400" :
                item.status === "contacted" ? "text-cyan-400" :
                item.status === "deal_in_progress" ? "text-blue-400" :
                item.status === "deal_closed" ? "text-purple-400" :
                "text-muted-foreground"
              }`} />
            )}
          </div>

          <StatusTimeline currentStatus={item.status} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ tab }) {
  const messages = {
    all:               { title: "No requests yet", desc: "Browse the marketplace to reserve a spot or request an acquisition." },
    reserve_spot:      { title: "No spot reservations", desc: "You haven't reserved any spots yet." },
    acquisition_request: { title: "No acquisition requests", desc: "You haven't submitted any acquisition requests yet." },
    bid_request:       { title: "No bid requests", desc: "You haven't placed any bid requests yet." },
    pending:           { title: "No pending requests", desc: "All your requests have been processed." },
    approved:          { title: "No approved requests", desc: "None of your requests have been approved yet." },
  };
  const msg = messages[tab] || messages.all;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{msg.title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{msg.desc}</p>
    </div>
  );
}

export default function MyRequests() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUserId(u?.id))
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const { data: reservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ["myReservations", userId],
    queryFn: () => base44.entities.DealReservations.filter({ userId }, "-created_date", 50),
    enabled: !!userId,
  });

  const { data: acquisitions = [], isLoading: loadingAcq } = useQuery({
    queryKey: ["myAcquisitions", userId],
    queryFn: () => base44.entities.AcquisitionRequests.filter({ userId }, "-created_date", 50),
    enabled: !!userId,
  });

  const { data: bidRequests = [], isLoading: loadingBids } = useQuery({
    queryKey: ["myBidRequests", userId],
    queryFn: () => base44.entities.BidRequests.filter({ userId }, "-created_date", 50),
    enabled: !!userId,
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["allListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const listingMap = {};
  allListings.forEach((l) => {
    listingMap[l.id] = l;
  });

  const handleCancelReservation = async (r) => {
    await base44.entities.DealReservations.update(r.id, { status: "cancelled" });
    queryClient.invalidateQueries({ queryKey: ["myReservations"] });
    toast.success("Reservation cancelled");
    try {
      await base44.functions.invoke("notifyAdminRequestCancelled", {
        userName: r.userName, userEmail: r.userEmail,
        listingTitle: r.listingTitle, requestType: "reserve_spot",
        listingId: r.listingId, requestId: r.id,
      });
    } catch (_) {}
  };

  const handleCancelAcquisition = async (a) => {
    await base44.entities.AcquisitionRequests.update(a.id, { status: "cancelled" });
    queryClient.invalidateQueries({ queryKey: ["myAcquisitions"] });
    toast.success("Request cancelled");
    try {
      await base44.functions.invoke("notifyAdminRequestCancelled", {
        userName: a.userName, userEmail: a.userEmail,
        listingTitle: a.listingTitle, requestType: "acquisition_request",
        listingId: a.listingId, requestId: a.id,
      });
    } catch (_) {}
  };

  const handleCancelBidRequest = async (br) => {
    await base44.entities.BidRequests.update(br.id, { status: "cancelled" });
    queryClient.invalidateQueries({ queryKey: ["myBidRequests"] });
    toast.success("Bid request cancelled");
    try {
      await base44.functions.invoke("notifyAdminRequestCancelled", {
        userName: br.userName, userEmail: br.userEmail,
        listingTitle: br.listingTitle, requestType: "bid_request",
        listingId: br.listingId, requestId: br.id,
      });
    } catch (_) {}
  };

  const allItems = useMemo(() => {
    return [
      ...reservations.map((r) => ({ ...r, _type: "reserve_spot" })),
      ...acquisitions.map((a) => ({ ...a, _type: "acquisition_request" })),
      ...bidRequests.map((br) => ({ ...br, _type: "bid_request", budget: 0, offerAmount: 0, message: br.message || "", notes: "" })),
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [reservations, acquisitions, bidRequests]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab === "all") return true;
      if (activeTab === "reserve_spot") return item._type === "reserve_spot";
      if (activeTab === "acquisition_request") return item._type === "acquisition_request";
      if (activeTab === "bid_request") return item._type === "bid_request";
      if (activeTab === "pending") return item.status === "pending";
      if (activeTab === "approved") return ["approved", "contacted", "deal_in_progress", "deal_closed"].includes(item.status);
      return true;
    });
  }, [allItems, activeTab]);

  const tabCounts = useMemo(() => ({
    all: allItems.length,
    reserve_spot: allItems.filter((i) => i._type === "reserve_spot").length,
    acquisition_request: allItems.filter((i) => i._type === "acquisition_request").length,
    bid_request: allItems.filter((i) => i._type === "bid_request").length,
    pending: allItems.filter((i) => i.status === "pending").length,
    approved: allItems.filter((i) => ["approved", "contacted", "deal_in_progress", "deal_closed"].includes(i.status)).length,
  }), [allItems]);

  const isLoading = loadingUser || loadingRes || loadingAcq || loadingBids;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">My Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your reservations and acquisition requests.</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 w-fit overflow-x-auto max-w-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeTab === tab.id
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-secondary/60 text-muted-foreground"
              }`}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {filteredItems.map((item) => (
                <RequestCard
                  key={`${item._type}-${item.id}`}
                  item={item}
                  type={item._type}
                  onCancel={item._type === "reserve_spot" ? handleCancelReservation : item._type === "bid_request" ? handleCancelBidRequest : handleCancelAcquisition}
                  listingMap={listingMap}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}