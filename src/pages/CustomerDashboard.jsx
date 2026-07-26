import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, Mail } from "lucide-react";
import UserAccountSettings from "@/components/dashboard/UserAccountSettings";
import LeadSmtpSettings from "@/components/leadfinder/LeadSmtpSettings";

export default function CustomerDashboard() {
  // Deep-link support: /my-account?tab=smtp opens the Outreach Email tab directly.
  const initialTab = new URLSearchParams(window.location.search).get("tab") === "smtp" ? "smtp" : "account";
  const [tab, setTab] = useState(initialTab);
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

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
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "smtp" ? (
        <div className="space-y-6">
          <LeadSmtpSettings user={currentUser} />
        </div>
      ) : (
        <div className="space-y-6">
          <UserAccountSettings user={currentUser} />
        </div>
      )}
    </div>
  );
}