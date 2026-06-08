import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Zap, Store, PieChart, Upload, Wallet, Shield, Gavel, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/auctions", label: "Live Auctions" },
  { to: "/investments", label: "My Deals" },
  { to: "/wallet", label: "Wallet" },
  { to: "/admin", label: "Admin" },
];

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base">
            SaaS<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Share</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-orange-400"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm">
            <Link to="/sell">Submit Your SaaS</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-secondary/50" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors",
                  isActive ? "text-orange-400 bg-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <Link to="/sell" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Submit Your SaaS</Button>
          </Link>
        </div>
      )}
    </header>
  );
}