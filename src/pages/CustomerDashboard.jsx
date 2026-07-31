import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, Mail, Send, KeyRound } from "lucide-react";
import UserAccountSettings from "@/components/dashboard/UserAccountSettings";
import LeadSmtpSettings from "@/components/leadfinder/LeadSmtpSettings";
import TelegramSettings from "@/components/dashboard/TelegramSettings";
import CustomApiKeysSettings from "@/components/dashboard/CustomApiKeysSettings";
import MyPlansCard from "@/components/dashboard/MyPlansCard";
import { useEffectivePlan } from "@/hooks/useEffectivePlan";

export default function CustomerDashboard() {
  // Deep-link support: /my-account?tab=smtp opens the Outreach Email tab directly.
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  const initialTab = tabParam === "smtp" ? "smtp" : tabParam === "telegram" ? "telegram" : tabParam === "api-keys" ? "api-keys" : "account";
  const [tab, setTab] = useState(initialTab);
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Telegram is a plan-gated feature. Admins always have access.
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  // Merge ALL held plans (primary + JVZoo-stacked) so bundle + bump features combine.
  const { plans: myPlans, effectivePlan: userPlan } = useEffectivePlan(currentUser);
  const telegramAllowed = isAdmin || !!userPlan?.telegramAllowed;
  const customApiKeyAllowed = isAdmin || !!userPlan?.customApiKeyAllowed;
  const activeTab =
    (tab === "telegram" && !telegramAllowed) ? "account" :
    (tab === "api-keys" && !customApiKeyAllowed) ? "account" :
    tab;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">My Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Your profile, purchases, favorites, reviews, and demo requests.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        {[
          { id: "account", label: "Account", icon: User },
          { id: "smtp", label: "Outreach Email", icon: Mail },
          ...(customApiKeyAllowed ? [{ id: "api-keys", label: "Custom API Keys", icon: KeyRound }] : []),
          ...(telegramAllowed ? [{ id: "telegram", label: "Telegram", icon: Send }] : []),
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "smtp" ? (
        <div className="space-y-6">
          <LeadSmtpSettings user={currentUser} />
        </div>
      ) : activeTab === "api-keys" ? (
        <div className="space-y-6">
          <CustomApiKeysSettings user={currentUser} allowed={customApiKeyAllowed} />
        </div>
      ) : activeTab === "telegram" ? (
        <div className="space-y-6">
          <TelegramSettings />
        </div>
      ) : (
        <div className="space-y-6">
          <MyPlansCard plans={myPlans} primaryPlanId={currentUser?.planId} />
          <UserAccountSettings user={currentUser} />
        </div>
      )}
    </div>
  );
}