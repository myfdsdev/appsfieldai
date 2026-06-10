import React from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Bell, Gavel, DollarSign, Building2, Users, CalendarCheck, CheckCircle, Ban, Phone, TrendingUp, BadgeCheck, Store, XCircle, Loader2, ChevronLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeConfig = {
  outbid:              { icon: Gavel, color: "bg-amber-500/10 text-amber-400" },
  dividend:            { icon: DollarSign, color: "bg-emerald-500/10 text-emerald-400" },
  share_purchased:     { icon: Users, color: "bg-violet-500/10 text-violet-400" },
  ownership_sold:      { icon: Building2, color: "bg-cyan-500/10 text-cyan-400" },
  reserve_submitted:   { icon: CalendarCheck, color: "bg-violet-500/10 text-violet-400" },
  acquisition_submitted:{ icon: Building2, color: "bg-blue-500/10 text-blue-400" },
  request_approved:    { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-400" },
  request_rejected:    { icon: Ban, color: "bg-red-500/10 text-red-400" },
  request_contacted:   { icon: Phone, color: "bg-cyan-500/10 text-cyan-400" },
  request_in_progress: { icon: TrendingUp, color: "bg-blue-500/10 text-blue-400" },
  deal_closed:         { icon: BadgeCheck, color: "bg-purple-500/10 text-purple-400" },
  listing_submitted:   { icon: Store, color: "bg-violet-500/10 text-violet-400" },
  request_cancelled:   { icon: XCircle, color: "bg-red-500/10 text-red-400" },
  new_reservation:     { icon: CalendarCheck, color: "bg-violet-500/10 text-violet-400" },
  new_acquisition:     { icon: Building2, color: "bg-blue-500/10 text-blue-400" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const diff = now - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) return [];
        const user = await base44.auth.me();
        return base44.entities.Notification.filter(
          { userId: user.id },
          ["-created_date"],
          100
        );
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !(n.isRead || n.read)).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !(n.isRead || n.read));
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { isRead: true, read: true });
    }
    queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
  };

  const markRead = async (n) => {
    if (!(n.isRead || n.read)) {
      await base44.entities.Notification.update(n.id, { isRead: true, read: true });
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-orange-400 hover:text-orange-300 gap-1.5">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">When you receive notifications, they'll appear here.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] || { icon: Bell, color: "bg-secondary/50 text-muted-foreground" };
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={n.listingId ? `/saas/${n.listingId}` : n.relatedRequestId ? "/requests" : "#"}
                  onClick={() => markRead(n)}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-colors block ${
                    !(n.isRead || n.read)
                      ? "bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10"
                      : "bg-card/60 border border-border/20 hover:bg-secondary/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!(n.isRead || n.read) ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {!(n.isRead || n.read) && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1.5">{timeAgo(n.created_date)}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}