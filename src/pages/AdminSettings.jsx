import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CreditCard, Settings, Palette, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import EmailSettings from "@/components/admin/settings/EmailSettings";
import PaymentSettings from "@/components/admin/settings/PaymentSettings";
import GeneralSettings from "@/components/admin/settings/GeneralSettings";
import ThemeColorSettings from "@/components/admin/settings/ThemeColorSettings";
import AIEngineSettings from "@/components/admin/settings/AIEngineSettings";

const TABS = [
  { id: "email", label: "Email Settings", icon: Mail },
  { id: "payment", label: "Payment Settings", icon: CreditCard },
  { id: "general", label: "General Settings", icon: Settings },
  { id: "ai", label: "AI & Engine", icon: Cpu },
  { id: "theme", label: "Theme Colors", icon: Palette },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("email");

  const ActiveTabIcon = TABS.find((t) => t.id === activeTab)?.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your platform configuration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-2xl border border-border/30 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "email" && <EmailSettings />}
              {activeTab === "payment" && <PaymentSettings />}
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "ai" && <AIEngineSettings />}
              {activeTab === "theme" && <ThemeColorSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}