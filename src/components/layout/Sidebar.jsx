import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Store, Gavel, PieChart, Upload, Shield, Zap, ChevronLeft, ChevronRight, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/marketplace", icon: Store, label: "Marketplace" },
  { to: "/auctions", icon: Gavel, label: "Live Auctions", feature: "liveAuctionsAllowed" },
  { to: "/requests", icon: ClipboardList, label: "My Requests", feature: "myRequestsAllowed" },
  { to: "/sell", icon: Upload, label: "Sell My SaaS" },
  { to: "/admin", icon: Shield, label: "Admin Panel", adminOnly: true },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Resolve the user's plan so paid features can be gated in the nav.
  const { data: userPlan = null } = useQuery({
    queryKey: ["userPlan", user?.planId],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ id: user.planId }).then((r) => r[0] || null),
    enabled: !!user?.planId,
  });

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    // Plan-gated items: only show to admins or plans that include the feature.
    if (item.feature && !isAdmin && !userPlan?.[item.feature]) return false;
    return true;
  });
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      className="fixed left-0 top-0 h-full bg-card/80 backdrop-blur-xl border-r border-border/40 z-40 flex flex-col transition-colors"
    >
      <div className={cn("flex items-center gap-3 px-4 h-16 border-b border-border/30", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-base">
            SaaS<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Share</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-gradient-to-r from-violet-500/10 to-cyan-500/10 text-violet-400 border border-violet-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border/40 flex items-center justify-center hover:bg-secondary/80 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}