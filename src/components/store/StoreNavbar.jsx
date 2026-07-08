import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, Menu, X, User, LogOut, ChevronDown, ShoppingCart, Share2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

// Top navigation bar for a customer's public store page — mirrors the main app's
// top bar (logo + nav links), styled with the store's own branding.
export default function StoreNavbar({ marketplace, sections = {}, customer, onOpenAuth, onLogout, onOpenAccount, onOpenAffiliate, affiliateEnabled = false, affiliatePath, cartCount = 0, onOpenCart, dashboardPath = "/dashboard" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const goToDashboard = () => navigate(dashboardPath);
  const goToAccount = () => navigate(`${dashboardPath}?tab=account`);
  // Prefer navigating to the full affiliate page; fall back to the legacy onOpenAffiliate callback.
  const goToAffiliate = () => (affiliatePath ? navigate(affiliatePath) : onOpenAffiliate?.());
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  // Theme-aware logo: prefer the dark logo in dark mode, fall back gracefully.
  const lightLogo = marketplace.branding?.logo;
  const darkLogo = marketplace.branding?.logoDark;
  const themedLogo = theme === "dark" ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const logo = sections.headerLogoUrl || themedLogo;
  const name = marketplace.name || "Store";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navItems = [
    { label: "Best Sellers", target: "store-best-sellers" },
    { label: "Categories", target: "store-categories" },
    { label: "Lifetime Deals", target: "store-lifetime-deals" },
    ...(marketplace.type === "multi_vendor" ? [{ label: "Become A Vendor?", target: "store-become-vendor" }] : []),
  ];

  const AccountButton = () => {
    if (customer) {
      return (
        <div className="relative ml-1" ref={accountRef}>
          <button
            onClick={() => setAccountOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-white/5 hover:bg-secondary/80 transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: brandColor }}>
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium max-w-[120px] truncate">{customer.fullName || customer.email}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${accountOpen ? "rotate-180" : ""}`} />
          </button>
          {accountOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-card border border-border/40 rounded-xl shadow-2xl shadow-black/40 py-2 z-50">
              <div className="px-3 py-2 border-b border-border/30 mb-1">
                <p className="text-sm font-medium truncate">{customer.fullName || "Customer"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{customer.email}</p>
              </div>
              <button
                onClick={() => { setAccountOpen(false); goToDashboard(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/60 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" /> My Dashboard
              </button>
              <button
                onClick={() => { setAccountOpen(false); goToAccount(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/60 transition-colors ${affiliateEnabled ? "" : "border-b border-border/30 mb-1"}`}
              >
                <User className="w-4 h-4 text-muted-foreground" /> My Account
              </button>
              {affiliateEnabled && (
                <button
                  onClick={() => { setAccountOpen(false); goToAffiliate(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/60 transition-colors border-b border-border/30 mb-1"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" /> Affiliate Program
                </button>
              )}
              <button
                onClick={() => { setAccountOpen(false); onLogout?.(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <button
        onClick={() => onOpenAuth?.("login")}
        className="ml-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-white/5 hover:bg-secondary/80 transition-colors"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: brandColor }}>
          <User className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium">Sign In</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button onClick={() => scrollTo("store-listings")} className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={name} className="h-9 max-w-[200px] object-contain" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColor }}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-display font-bold truncate max-w-[200px]">{name}</span>
            </>
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => scrollTo(item.target)}
              className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("store-listings")}
            className="ml-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: brandColor }}
          >
            Browse Deals
          </button>
          {/* Cart */}
          <button onClick={() => onOpenCart?.()} className="relative ml-1 w-9 h-9 rounded-xl bg-secondary/60 border border-white/5 hover:bg-secondary/80 flex items-center justify-center transition-colors" title="Cart">
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: brandColor }}>{cartCount}</span>
            )}
          </button>
          {/* User option */}
          <AccountButton />
        </nav>

        {/* Mobile toggle + cart */}
        <div className="md:hidden flex items-center gap-1">
          <button onClick={() => onOpenCart?.()} className="relative p-2 rounded-lg hover:bg-secondary/50" title="Cart">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: brandColor }}>{cartCount}</span>
            )}
          </button>
          <button onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-lg hover:bg-secondary/50">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border/40 px-6 py-3 flex flex-col gap-1 bg-background/95">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => scrollTo(item.target)}
              className="text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("store-listings")}
            className="mt-1 px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: brandColor }}
          >
            Browse Deals
          </button>
          {customer ? (
            <>
              <div className="mt-1 px-3 py-2 rounded-xl bg-secondary/50 text-sm">
                <p className="font-medium truncate">{customer.fullName || customer.email}</p>
                <p className="text-[11px] text-muted-foreground truncate">{customer.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); goToDashboard(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-white/5 text-sm font-medium"
              >
                <User className="w-4 h-4" /> My Dashboard
              </button>
              <button
                onClick={() => { setMenuOpen(false); goToAccount(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-white/5 text-sm font-medium"
              >
                <User className="w-4 h-4" /> My Account
              </button>
              {affiliateEnabled && (
                <button
                  onClick={() => { setMenuOpen(false); goToAffiliate(); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-white/5 text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" /> Affiliate Program
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onLogout?.(); }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-white/5 text-sm font-medium text-red-400"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); onOpenAuth?.("login"); }}
              className="mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-white/5 text-sm font-medium"
            >
              <User className="w-4 h-4" style={{ color: brandColor }} /> Sign In
            </button>
          )}
        </nav>
      )}
    </header>
  );
}