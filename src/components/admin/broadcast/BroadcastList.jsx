import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Trash2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES = {
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cancelled: "bg-secondary text-muted-foreground border-border/30",
};

export default function BroadcastList() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["adminBroadcasts"],
    queryFn: () => base44.entities.AdminBroadcast.list("-created_date", 50),
  });

  const remove = async (id) => {
    await base44.entities.AdminBroadcast.delete(id);
    queryClient.invalidateQueries({ queryKey: ["adminBroadcasts"] });
    toast.success("Announcement deleted");
  };

  return (
    <Card className="border-border/40 bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
          <Bell className="w-4 h-4 text-violet-400" />Sent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No announcements yet.</p>
        ) : (
          items.map((b) => (
            <div key={b.id} className="flex items-start gap-3 rounded-xl border border-border/30 bg-[#252525] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{b.title}</p>
                  <Badge className={`${STATUS_STYLES[b.status] || STATUS_STYLES.scheduled} text-[10px]`}>{b.status}</Badge>
                  {b.sendEmail && <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]"><Mail className="w-3 h-3 mr-1" />Email</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.message}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.audience?.replace("_", " ")} · {b.recipientCount || 0} sent</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                    {b.status === "sent"
                      ? new Date(b.sentAt || b.created_date).toLocaleString()
                      : b.scheduledAt ? `Scheduled ${new Date(b.scheduledAt).toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-400" onClick={() => remove(b.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}