import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileStack, Search, CheckCircle, XCircle, Mail } from "lucide-react";

const TYPE_LABELS = {
  reserve_request_admin: "Reserve → Admin",
  acquisition_request_admin: "Acquisition → Admin",
  bid_request_admin: "Bid → Admin",
  demo_request_admin: "Demo → Admin",
  request_approved_user: "Approved → User",
  request_rejected_user: "Rejected → User",
  request_contacted_user: "Contacted → User",
};

export default function EmailLogsViewer() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["emailLogs"],
    queryFn: () => base44.entities.EmailLog.list("-sentAt", 200),
    staleTime: 0,
  });

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q || l.to?.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q) || l.type?.toLowerCase().includes(q);
  });

  return (
    <Card className="border-border/40 bg-[#1a1a1a]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
          <FileStack className="w-4 h-4 text-violet-400" />
          Email Logs
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] ml-1">{logs.length}</Badge>
        </CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by email, subject, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-[#252525] border-border/30 rounded-xl"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading logs...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No email logs found.</p>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{log.to}</span>
                    <Badge className={`text-[10px] border shrink-0 ${
                      log.status === "sent"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {log.status === "sent"
                        ? <><CheckCircle className="w-2.5 h-2.5 mr-0.5 inline" />Sent</>
                        : <><XCircle className="w-2.5 h-2.5 mr-0.5 inline" />Failed</>}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{log.subject}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-secondary/60 text-muted-foreground border-border/20 text-[10px]">
                      {TYPE_LABELS[log.type] || log.type}
                    </Badge>
                    {log.sentAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  {log.error && (
                    <p className="text-[10px] text-red-400 bg-red-500/5 rounded px-2 py-1 mt-1">{log.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}