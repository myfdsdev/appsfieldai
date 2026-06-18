import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
import { Video, CheckCircle, XCircle, Loader2, Mail, Phone, MessageCircle, Trash2, Clock, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const statusMap = {
  pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  scheduled: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DemoRequestManager({ marketplaceId, onStatusChange }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["demoRequests", marketplaceId],
    queryFn: () =>
      marketplaceId
        ? base44.entities.DemoRequests.filter({}, "-created_date", 100)
        : base44.entities.DemoRequests.list("-created_date", 100),
    staleTime: 0,
  });

  const notifTypeMap = {
    contacted: { type: "request_contacted", title: "Demo Request Update", msg: (t) => `Your demo request for "${t}" has been reviewed — we'll be in touch soon.` },
    completed: { type: "request_approved",  title: "Demo Request Approved", msg: (t) => `Your demo request for "${t}" has been approved!` },
    cancelled: { type: "request_cancelled", title: "Demo Request Cancelled", msg: (t) => `Your demo request for "${t}" has been cancelled.` },
  };

  const handleStatus = async (req, status) => {
    setActionLoading(`${req.id}-${status}`);
    try {
      await base44.entities.DemoRequests.update(req.id, { status });
      queryClient.invalidateQueries({ queryKey: ["demoRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myDemoRequests"] });

      // Send user notification if we have a userId
      const notifCfg = notifTypeMap[status];
      if (notifCfg && req.userId) {
        try {
          await base44.functions.invoke("createAppNotification", {
            userId: req.userId,
            role: "user",
            type: notifCfg.type,
            title: notifCfg.title,
            message: notifCfg.msg(req.listingTitle || "your listing"),
            listingId: req.listingId || "",
            relatedRequestId: req.id,
          });
        } catch (e) {
          console.error("Notification failed:", e);
        }
      }

      if (onStatusChange) onStatusChange(req, status);
      toast.success(`Demo request marked as ${status}.`);
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (req) => {
    setActionLoading(`${req.id}-delete`);
    try {
      await base44.entities.DemoRequests.delete(req.id);
      queryClient.invalidateQueries({ queryKey: ["demoRequests"] });
      toast.success("Demo request deleted.");
    } catch (err) {
      toast.error("Failed to delete.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" /> Demo Requests
          {requests.length > 0 && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{requests.length}</Badge>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No demo requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const isLoading = (key) => actionLoading === `${r.id}-${key}`;
            return (
              <div key={r.id} className="bg-card/40 border border-border/40 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{r.userName}</span>
                      <Badge className={`text-[10px] border ${statusMap[r.status] || ""}`}>{r.status}</Badge>
                    </div>
                    <p className="text-xs font-medium text-orange-400">{r.listingTitle || "—"}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.userEmail}</span>
                      {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {r.message && (
                      <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2 flex items-start gap-1.5">
                        <MessageCircle className="w-3 h-3 shrink-0 mt-0.5" />{r.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "contacted")} disabled={isLoading("contacted")} className="h-7 text-xs text-blue-400 hover:bg-blue-500/10">
                        <PhoneCall className="w-3 h-3 mr-1" /> Contact
                      </Button>
                    )}
                    {(r.status === "pending" || r.status === "contacted") && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "completed")} disabled={isLoading("completed")} className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    )}
                    {(r.status === "pending" || r.status === "contacted") && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "cancelled")} disabled={isLoading("cancelled")} className="h-7 text-xs text-red-400 hover:bg-red-500/10">
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r)} disabled={isLoading("delete")} className="h-7 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}