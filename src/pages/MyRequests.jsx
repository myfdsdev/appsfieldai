import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ClipboardList, CalendarCheck, Building2, Clock, X, CheckCircle, Ban, DollarSign, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MyRequests() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => { setUserId(u?.id); }).catch(() => {}).finally(() => setLoadingUser(false));
  }, []);

  const { data: reservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ["myReservations", userId],
    queryFn: () => base44.entities.DealReservations.filter({ userId }, ["-created_date"], 50),
    enabled: !!userId,
  });

  const { data: acquisitions = [], isLoading: loadingAcq } = useQuery({
    queryKey: ["myAcquisitions", userId],
    queryFn: () => base44.entities.AcquisitionRequests.filter({ userId }, ["-created_date"], 50),
    enabled: !!userId,
  });

  const handleCancelReservation = async (r) => {
    await base44.entities.DealReservations.update(r.id, { status: "cancelled" });
    queryClient.invalidateQueries({ queryKey: ["myReservations"] });
    toast.success("Reservation cancelled");
  };

  const handleCancelAcquisition = async (a) => {
    await base44.entities.AcquisitionRequests.update(a.id, { status: "cancelled" });
    queryClient.invalidateQueries({ queryKey: ["myAcquisitions"] });
    toast.success("Request cancelled");
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

  const isLoading = loadingUser || loadingRes || loadingAcq;

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reservations */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-violet-400" />
                Spot Reservations
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{reservations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/30">
              {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No reservations yet</p>
              ) : (
                reservations.map((r) => (
                  <div key={r.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.listingTitle || "Unknown Listing"}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {statusBadge(r.status)}
                        {r.budget > 0 && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" /> ${r.budget?.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {new Date(r.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {r.message && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{r.message}</span>
                        </p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancelReservation(r)} className="text-red-400/60 hover:text-red-400 h-7 text-[11px] shrink-0">
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                    {r.status === "approved" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {r.status === "rejected" && <Ban className="w-4 h-4 text-red-400 shrink-0" />}
                    {r.status === "contacted" && <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Acquisition Requests */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-400" />
                Acquisition Requests
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">{acquisitions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/30">
              {acquisitions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No requests yet</p>
              ) : (
                acquisitions.map((a) => (
                  <div key={a.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.listingTitle || "Unknown Listing"}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {statusBadge(a.status)}
                        {a.offerAmount > 0 && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" /> ${a.offerAmount?.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {new Date(a.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {a.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{a.notes}</span>
                        </p>
                      )}
                    </div>
                    {a.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancelAcquisition(a)} className="text-red-400/60 hover:text-red-400 h-7 text-[11px] shrink-0">
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                    {a.status === "approved" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {a.status === "rejected" && <Ban className="w-4 h-4 text-red-400 shrink-0" />}
                    {a.status === "contacted" && <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}