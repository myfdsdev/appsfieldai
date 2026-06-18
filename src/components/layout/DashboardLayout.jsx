import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import OutbidNotifier from "@/components/notifications/OutbidNotifier";
import AiChatWidget from "@/components/chat/AiChatWidget";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <OutbidNotifier />
      <Topbar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
      <AiChatWidget />
    </div>
  );
}