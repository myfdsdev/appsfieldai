import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, ShieldCheck, FileText,
  Store, Clock, Layers, Image, Building2, Gavel,
  Bell, Mail, Smartphone, Settings,
  Ticket, Globe, Star, FileCode,
  Bot, Database, Sparkles, Workflow,
  MessageSquare, AtSign, FileStack, ContactRound,
  SlidersHorizontal, CreditCard, Link, Webhook,
  ChevronDown, Plug, MailCheck, ShoppingBag, LayoutDashboard, Palette,
} from "lucide-react";

const NAV_GROUPS = [
  {
    id: "users",
    label: "Users & Access",
    items: [
      { id: "users",       label: "Users",               icon: Users },
      { id: "invite",      label: "Invite User",          icon: UserPlus },
      { id: "roles",       label: "Roles & Permissions",  icon: ShieldCheck },
      { id: "access_logs", label: "Access Logs",          icon: FileText },
    ],
  },
  {
  id: "content",
  label: "Content & Media",
  items: [
  { id: "content",        label: "SaaS Listings",     icon: Store },
  { id: "pending",        label: "Pending Approvals", icon: Clock },
  { id: "reservations",   label: "Reservations",      icon: Users },
  { id: "acquisitions",   label: "Acquisitions",      icon: Building2 },
  { id: "bid_requests",   label: "Bid Requests",       icon: Gavel },
  { id: "templates",      label: "Templates",         icon: Layers },
  { id: "media",          label: "Media Library",     icon: Image },
  ],
  },
  {
    id: "notifications_group",
    label: "Notifications",
    items: [
      { id: "app_notif",    label: "App Notifications",    icon: Bell },
      { id: "email_notif",  label: "Email Notifications",  icon: Mail },
      { id: "push_notif",   label: "Push Notifications",   icon: Smartphone },
      { id: "notif_settings", label: "Notification Settings", icon: Settings },
    ],
  },
  {
    id: "hooks_group",
    label: "Content Presets",
    items: [
      { id: "hooks",          label: "Hook Management",      icon: Ticket },
      { id: "mktpl_templates",label: "Marketplace Templates",icon: Globe },
      { id: "pricing_presets",label: "Pricing Presets",      icon: Star },
      { id: "email_templates",label: "Email Templates",      icon: FileCode },
    ],
  },
  {
    id: "ai_group",
    label: "AI & Engine",
    items: [
      { id: "ai",          label: "AI Agent",          icon: Bot },
      { id: "qna_db",      label: "QnA Database",      icon: Database },
      { id: "ai_recs",     label: "AI Recommendations",icon: Sparkles },
      { id: "automation",  label: "Automation Rules",  icon: Workflow },
    ],
  },
  {
    id: "comms_group",
    label: "Comms & Mailing",
    items: [
      { id: "comms",       label: "Gmail",            icon: Mail },
      { id: "smtp",        label: "SMTP Settings",    icon: AtSign },
      { id: "email_logs",  label: "Email Logs",       icon: FileStack },
      { id: "contact_msgs",label: "Contact Messages", icon: ContactRound },
    ],
  },
  {
    id: "integrations_group",
    label: "Integrations",
    items: [
      { id: "int_stripe",    label: "Stripe",         icon: CreditCard },
      { id: "int_razorpay",  label: "Razorpay",       icon: Plug },
      { id: "int_gmail",     label: "Gmail / SMTP",   icon: MailCheck },
      { id: "int_jvzoo",     label: "JVZoo",          icon: ShoppingBag },
      { id: "int_webhooks",  label: "Webhooks",       icon: Webhook },
    ],
  },
  {
    id: "dashboard_group",
    label: "Dashboard & UI",
    items: [
      { id: "dashboard",       label: "Dashboard Editor",    icon: LayoutDashboard },
      { id: "hero_background", label: "Hero Background",     icon: Palette },
    ],
  },
  {
    id: "system_group",
    label: "System & Config",
    items: [
      { id: "system",           label: "General Settings", icon: SlidersHorizontal },
      { id: "payment_settings", label: "Payment Settings", icon: CreditCard },
      { id: "domain_settings",  label: "Domain Settings",  icon: Globe },
      { id: "stripe_int",       label: "Integrations",     icon: Link },
      { id: "webhooks_int",     label: "Webhooks",         icon: Webhook },
    ],
  },
];

export default function AdminTopNav({ activeTab, onTabChange }) {
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGroupClick = (groupId) => {
    setOpenGroup(prev => prev === groupId ? null : groupId);
  };

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    setOpenGroup(null);
  };

  return (
    <div ref={navRef} className="relative">
      {/* Top pill nav bar */}
      <div className="flex gap-1 flex-wrap bg-[#111111] border border-border/40 rounded-2xl p-1.5">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroup === group.id;
          const hasActive = group.items.some(i => i.id === activeTab);

          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => handleGroupClick(group.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  hasActive
                    ? "bg-[#d93025]/15 text-orange-400 border border-[#d93025]/30"
                    : isOpen
                    ? "bg-[#1e1e1e] text-foreground border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] border border-transparent"
                }`}
              >
                {group.label}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex"
                >
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </motion.span>
              </button>

              {/* Dropdown panel */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2 z-50 min-w-[200px]"
                  >
                    <div className="bg-[#131313]/95 backdrop-blur-md border border-white/8 rounded-xl shadow-2xl shadow-black/60 p-1.5 overflow-hidden">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                              isActive
                                ? "bg-[#d93025]/15 text-orange-400"
                                : "text-gray-300 hover:text-white hover:bg-white/6"
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-orange-400" : "text-gray-500"}`} />
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
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
      </div>
    </div>
  );
}