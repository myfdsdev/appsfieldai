import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}