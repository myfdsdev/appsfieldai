import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, ShieldCheck, FileText,
  Store, Clock, CalendarCheck, Building2, Gavel, Handshake,
  CreditCard, Users2, Receipt, FileCheck, Ticket,
  Settings, Mail, DollarSign, Globe, Bell,
  Zap, Link, ChevronDown, Crown, LayoutDashboard,
  RefreshCw, Layers, Code2, Bot, MessageSquare,
  BarChart3, Tag
} from "lucide-react";

const menuGroups = [
  {
    id: "users",
    label: "Users & Access",
    icon: Users,
    color: "text-violet-400",
    activeBg: "bg-violet-500/10 border-violet-500/30",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "invite", label: "Invite User", icon: UserPlus },
      { id: "roles", label: "Roles & Permissions", icon: ShieldCheck },
      { id: "access_logs", label: "Access Logs", icon: FileText },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: Store,
    color: "text-cyan-400",
    activeBg: "bg-cyan-500/10 border-cyan-500/30",
    items: [
      { id: "content", label: "SaaS Listings", icon: Store },
      { id: "pending", label: "Pending Approvals", icon: Clock },
      { id: "comms", label: "Reservations", icon: CalendarCheck },
      { id: "acquisitions", label: "Acquisition Requests", icon: Building2 },
      { id: "bid_requests", label: "Bid Requests", icon: Gavel },
      { id: "leads", label: "Leads", icon: Handshake },
    ],
  },
  {
    id: "billing",
    label: "Subscription & Billing",
    icon: CreditCard,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/10 border-emerald-500/30",
    items: [
      { id: "hooks", label: "Plans", icon: Tag },
      { id: "subscriptions", label: "User Subscriptions", icon: Users2 },
      { id: "payments", label: "Payments", icon: Receipt },
      { id: "invoices", label: "Invoices", icon: FileCheck },
      { id: "coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    id: "platform",
    label: "Platform Settings",
    icon: Settings,
    color: "text-amber-400",
    activeBg: "bg-amber-500/10 border-amber-500/30",
    items: [
      { id: "system", label: "General Settings", icon: Settings },
      { id: "email_settings", label: "Email Settings", icon: Mail },
      { id: "payment_settings", label: "Payment Settings", icon: DollarSign },
      { id: "dashboard", label: "Dashboard & UI", icon: LayoutDashboard },
      { id: "notif_settings", label: "Notification Settings", icon: Bell },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Zap,
    color: "text-orange-400",
    activeBg: "bg-orange-500/10 border-orange-500/30",
    items: [
      { id: "stripe_int", label: "Stripe", icon: CreditCard },
      { id: "razorpay_int", label: "Razorpay", icon: DollarSign },
      { id: "gmail_int", label: "Gmail / SMTP", icon: Mail },
      { id: "jvzoo_int", label: "JVZoo", icon: Link },
      { id: "webhooks_int", label: "Webhooks", icon: Code2 },
    ],
  },
  {
    id: "advanced",
    label: "AI & Advanced",
    icon: Bot,
    color: "text-pink-400",
    activeBg: "bg-pink-500/10 border-pink-500/30",
    items: [
      { id: "ai", label: "AI & Engine", icon: Bot },
      { id: "chat_monitor", label: "Chat Monitor", icon: MessageSquare },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export default function AdminSidebar({ activeTab, onTabChange }) {
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    menuGroups.forEach(g => {
      const hasActive = g.items.some(i => i.id === activeTab);
      initial[g.id] = hasActive;
    });
    return initial;
  });

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleItemClick = (itemId, groupId) => {
    onTabChange(itemId);
    setOpenGroups(prev => ({ ...prev, [groupId]: true }));
  };

  return (
    <div className="w-full lg:w-64 shrink-0">
      <div className="bg-[#111111] border border-border/40 rounded-2xl overflow-hidden">
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-border/30 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d93025]/10 flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#d93025]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground">Control Center</p>
          </div>
        </div>

        {/* Menu Groups */}
        <nav className="p-2 space-y-0.5">
          {menuGroups.map(group => {
            const GroupIcon = group.icon;
            const isGroupOpen = !!openGroups[group.id];
            const hasActiveChild = group.items.some(i => i.id === activeTab);

            return (
              <div key={group.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    hasActiveChild
                      ? `${group.activeBg} border ${group.color}`
                      : "text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? group.color : ""}`} />
                    <span className="truncate">{group.label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isGroupOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </motion.div>
                </button>

                {/* Group Items */}
                <AnimatePresence initial={false}>
                  {isGroupOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-border/30 space-y-0.5">
                        {group.items.map(item => {
                          const ItemIcon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item.id, group.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-[#d93025]/15 text-[#f87171] border border-[#d93025]/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]"
                              }`}
                            >
                              <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#f87171]" : ""}`} />
                              <span className="truncate">{item.label}</span>
                              {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d93025] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}