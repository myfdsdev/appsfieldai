import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, ChevronDown, LayoutDashboard, Store, Gavel, CreditCard, ClipboardList, TrendingUp, Building2, ShoppingCart, Shield, Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { base44 } from "@/api/base44Client";

const DEFAULT_LOGO = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png";

const mainNavLinks = [
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/categories", label: "Categories" },
  { to: "/lifetime-deals", label: "Lifetime Deals" },
  { to: "/vendor/register", label: "Become A Vendor?" },
];

const profileMenuItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/auctions", label: "Live Auctions", icon: Gavel },
  { to: "/requests", label: "My Requests", icon: ClipboardList },
  { to: "/investments", label: "Investments", icon: TrendingUp },
  { to: "/dashboard", label: "My Marketplaces", icon: Building2 },
  { to: "/my-account", label: "My Account", icon: ShoppingCart },
  { to: "/vendor/dashboard", label: "Vendor Management", icon: Settings },
  { to: "/pricing", label: "Plans", icon: Package },
];

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Cached app-wide so the logo is fetched once and persists across page navigations
  // (no re-fetch / flash on every route change).
  const { data: cfgs, isFetched } = useQuery({
    queryKey: ["appBranding"],
    queryFn: () => base44.entities.AppConfig.filter({ key: "main" }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const cfg = cfgs?.[0];
  const branding = { logo: cfg?.appLogoUrl || "", siteName: cfg?.siteName || "" };
  const brandLoaded = isFetched;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-9xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 min-w-[140px] h-8">
          {brandLoaded && (
            <>
              {branding.logo ? (
                <img src={branding.logo} alt="logo" className="h-8 max-w-[140px] object-contain" />
              ) : (
                <span className="font-display font-bold text-base">
                  {branding.siteName || "Store"}
                </span>
              )}
            </>
          )}
        </Link>

        {/* Desktop Main Nav — store-only links, hidden for logged-in users */}
        <nav className="hidden md:flex items-center gap-1">
          {!isAuthenticated && mainNavLinks.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", isActive ? "text-orange-400" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side — Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <ThemeToggle />
              <NotificationBell />
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-white/5 hover:bg-secondary/80 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{user.full_name || user.email}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border/40 rounded-xl shadow-2xl shadow-black/40 py-2 z-50 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-border/30 mb-1">
                      <p className="text-sm font-medium truncate">{user.full_name || "User"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {profileMenuItems.map(({ to, label, icon: Icon }) => (
                      <button key={to} onClick={() => { setProfileOpen(false); navigate(to); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}

                    {isAdmin && (
                      <button onClick={() => { setProfileOpen(false); navigate("/admin"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 transition-colors">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </button>
                    )}

                    <div className="border-t border-border/30 mt-1 pt-1">
                      <button onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
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
        <button className="md:hidden p-2 rounded-lg hover:bg-secondary/50" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {!isAuthenticated && mainNavLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn("block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", isActive ? "text-orange-400 bg-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
              {label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-white/5 space-y-1">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Appearance</p>
              <ThemeToggle />
            </div>
            <p className="px-4 py-1 text-[10px] uppercase text-muted-foreground tracking-wider">Account</p>
            {isAuthenticated && user ? (
              <>
                {profileMenuItems.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => cn("flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", isActive ? "text-orange-400 bg-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
                    <Icon className="w-4 h-4" /> {label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl text-orange-400 hover:bg-orange-500/10">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </NavLink>
                )}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <User className="w-4 h-4 text-orange-400" /> {user.full_name || user.email}
                    </div>
                    <NotificationBell />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setMobileOpen(false); logout(); }} className="w-full justify-start gap-2 text-red-400">
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full rounded-xl">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl mt-1">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}