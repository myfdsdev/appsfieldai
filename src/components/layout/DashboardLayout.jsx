import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import SiteFooter from "./SiteFooter";
import OutbidNotifier from "@/components/notifications/OutbidNotifier";
import AiChatWidget from "@/components/chat/AiChatWidget";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OutbidNotifier />
      <Topbar />
      <main className="max-w-7xl w-full mx-auto px-6 py-6 flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <AiChatWidget />
    </div>
  );
}