import React from "react";
import { Store, Menu, X, User, LogOut, ChevronDown } from "lucide-react";

// Top navigation bar for a customer's public store page — mirrors the main app's
// top bar (logo + nav links), styled with the store's own branding.
export default function StoreNavbar({ marketplace, sections = {}, customer, onOpenAuth, onLogout }) {
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const logo = sections.headerLogoUrl || marketplace.branding?.logo;
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
    { label: "Become A Vendor?", target: "store-become-vendor" },
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
            <img src={logo} alt={name} className="w-9 h-9 object-contain rounded-lg" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColor }}>
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-lg font-display font-bold truncate max-w-[200px]">{name}</span>
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
          {/* User option */}
          <AccountButton />
        </nav>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen((o) => !o)} className="md:hidden p-2 rounded-lg hover:bg-secondary/50">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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