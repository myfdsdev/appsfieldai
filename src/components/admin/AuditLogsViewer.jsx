import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, ShieldCheck, CheckCircle, XCircle, Phone, TrendingUp, BadgeCheck, Trash2, Store } from "lucide-react";
import moment from "moment";

const ACTION_CONFIG = {
  approve_request:      { label: "Approved Request",     color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  reject_request:       { label: "Rejected Request",     color: "bg-red-500/10 text-red-400 border-red-500/20",             icon: XCircle },
  mark_contacted:       { label: "Marked Contacted",     color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",          icon: Phone },
  mark_in_progress:     { label: "Marked In Progress",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20",          icon: TrendingUp },
  close_deal:           { label: "Closed Deal",          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",    icon: BadgeCheck },
  delete_request:       { label: "Deleted Request",      color: "bg-red-500/10 text-red-400 border-red-500/20",             icon: Trash2 },
  approve_listing:      { label: "Approved Listing",     color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Store },
  reject_listing:       { label: "Rejected Listing",     color: "bg-red-500/10 text-red-400 border-red-500/20",             icon: Store },
};

export default function AuditLogsViewer() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-createdAt", 200),
  });

  const filtered = logs.filter(l =>
    !search ||
    l.adminName?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/40 bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
          <ClipboardList className="w-4 h-4 text-violet-400" />
          Admin Audit Logs
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-1">{logs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by admin, action, target..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#252525] border-border/30 rounded-xl h-8 text-xs"
          />
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Loading logs…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No audit logs found.</p>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map(log => {
              const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "bg-secondary text-muted-foreground border-border/30", icon: ShieldCheck };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color.split(" ")[0]}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color.split(" ")[1]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] border ${cfg.color}`}>{cfg.label}</Badge>
                      <span className="text-[11px] text-muted-foreground">{log.targetType}</span>
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{log.details || "—"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-violet-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />{log.adminName || log.adminId}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {log.createdAt ? moment(log.createdAt).fromNow() : moment(log.created_date).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}