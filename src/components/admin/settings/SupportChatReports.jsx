import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function SupportChatReports() {
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["supportChatReports"],
    queryFn: () => base44.entities.SupportChatReport.list("-created_date", 100),
  });

  const remove = async (r) => {
    await base44.entities.SupportChatReport.delete(r.id);
    queryClient.invalidateQueries({ queryKey: ["supportChatReports"] });
    toast.success("Report deleted");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-cyan-400" />Support Chat Reports
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] ml-2">{reports.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/20">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No chat reports yet. Reports are created when a user ends a support chat.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{r.userName || "Unknown"}</p>
                    <span className="text-xs text-muted-foreground">{r.userEmail}</span>
                    <Badge className="bg-secondary text-muted-foreground border-border/30 text-[10px]">{r.messageCount || 0} msgs</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.conclusion}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(r.created_date).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(r)} className="h-7 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                    <MessageSquare className="w-3 h-3 mr-1" />View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} className="h-7 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground text-base">
              {viewing?.userName || "Chat report"}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Conclusion</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{viewing.conclusion}</p>
              </div>
              {viewing.transcript && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transcript</p>
                  <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-body bg-[#252525] rounded-xl p-3">{viewing.transcript}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}