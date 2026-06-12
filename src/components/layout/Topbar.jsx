import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, LogOut, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";

const publicNavLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/auctions", label: "Live Auctions" },
  { to: "/investments", label: "Investments" },
  { to: "/requests", label: "My Requests" },
];

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navLinks = [
    ...publicNavLinks,
    { to: "/dashboard", label: "My Marketplaces" },
    { to: "/vendor/dashboard", label: "Vendor", icon: Store },
    ...(user?.role === "admin" || user?.role === "super_admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-9xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png"
            alt="logo"
            className="w-8 h-8 object-contain"
          />
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
                  isActive ? "text-orange-400" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions — Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{user.full_name || user.email}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => logout()}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground rounded-xl">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
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
                  isActive
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-white/5 space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <User className="w-4 h-4 text-orange-400" />
                    {user.full_name || user.email}
                  </div>
                  <NotificationBell />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="w-full justify-start gap-2 text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full rounded-xl">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}