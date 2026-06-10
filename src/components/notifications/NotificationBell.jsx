import React, { useState, useEffect, useRef } from "react";
import { Bell, Gavel, DollarSign, Building2, Users, CalendarCheck, CheckCircle, Ban, Phone, TrendingUp, BadgeCheck, Store, XCircle, FileText, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const d = new Date(dateStr);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["myNotificationsBell"],
    queryFn: async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return [];
      const user = await base44.auth.me();
      return base44.entities.Notification.filter(
        { userId: user.id },
        "-created_date",
        30
      );
    },
    refetchInterval: 15000,
    staleTime: 0,
  });

  const unreadCount = notifications.filter((n) => !(n.isRead || n.read)).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !(n.isRead || n.read));
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { isRead: true, read: true });
    }
    queryClient.invalidateQueries({ queryKey: ["myNotificationsBell"] });
    queryClient.invalidateQueries({ queryKey: ["myNotificationsPage"] });
  };

  const markReadAndNavigate = async (n) => {
    setOpen(false);
    if (!(n.isRead || n.read)) {
      await base44.entities.Notification.update(n.id, { isRead: true, read: true });
      queryClient.invalidateQueries({ queryKey: ["myNotificationsBell"] });
      queryClient.invalidateQueries({ queryKey: ["myNotificationsPage"] });
    }
    if (n.listingId) {
      navigate(`/saas/${n.listingId}`);
    } else if (n.relatedRequestId) {
      navigate("/requests");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-hidden rounded-xl bg-card/95 backdrop-blur-xl border border-border/40 shadow-2xl shadow-black/50 z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border/30 shrink-0">
            <span className="text-sm font-display font-bold">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors">
                  Mark all read
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const cfg = typeConfig[n.type] || { icon: Bell, color: "bg-secondary/50 text-muted-foreground" };
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => markReadAndNavigate(n)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-secondary/30 transition-colors border-b border-border/20 last:border-0 text-left ${!(n.isRead || n.read) ? "bg-orange-500/5" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!(n.isRead || n.read) ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        {!(n.isRead || n.read) && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_date)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}