import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Video, CheckCircle, XCircle, Loader2, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const statusBadge = (status) => {
  const map = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    scheduled: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return <Badge className={`text-[10px] border ${map[status] || ""}`}>{status}</Badge>;
};

export default function DemoRequestManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["demoRequests", marketplaceId],
    queryFn: () => base44.entities.DemoRequest.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
  });

  const handleStatus = async (req, status) => {
    setActionLoading(req.id);
    await base44.entities.DemoRequest.update(req.id, { status });
    queryClient.invalidateQueries({ queryKey: ["demoRequests", marketplaceId] });
    setActionLoading(null);
    toast.success(`Demo request ${status}.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" /> Demo Requests
        </h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No demo requests yet.</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {requests.map((r) => (
            <div key={r.id} className="bg-card/40 border border-border/40 rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{r.customerName}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{r.softwareName}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.customerEmail}</span>
                    {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                  </div>
                  {r.message && <p className="text-xs text-muted-foreground mt-2 bg-secondary/30 rounded-lg p-2"><MessageCircle className="w-3 h-3 inline mr-1" />{r.message}</p>}
                  <p className="text-[9px] text-muted-foreground mt-1">{new Date(r.created_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "contacted")} disabled={actionLoading === r.id} className="h-7 text-xs text-blue-400">Contact</Button>
                  )}
                  {r.status === "contacted" && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "scheduled")} disabled={actionLoading === r.id} className="h-7 text-xs text-violet-400">Schedule</Button>
                  )}
                  {(r.status === "pending" || r.status === "contacted" || r.status === "scheduled") && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "completed")} disabled={actionLoading === r.id} className="h-7 w-7 p-0 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /></Button>
                  )}
                  {(r.status === "pending" || r.status === "contacted") && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatus(r, "cancelled")} disabled={actionLoading === r.id} className="h-7 w-7 p-0 text-red-400"><XCircle className="w-3.5 h-3.5" /></Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}