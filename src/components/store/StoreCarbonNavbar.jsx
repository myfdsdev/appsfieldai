import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, Menu, X, User, LogOut, ShoppingCart, Share2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { getStoreStyle } from "@/components/store/storeStyles";

// Carbon-theme navbar — Binabox/NFT style: logo left, centered nav links,
// an accent "Browse Deals" pill on the right, using the Carbon theme font.
export default function StoreCarbonNavbar({ marketplace, sections = {}, customer, onOpenAuth, onLogout, onOpenAffiliate, affiliateEnabled = false, affiliatePath, cartCount = 0, onOpenCart, dashboardPath = "/dashboard" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const style = getStoreStyle(sections.storeStyle);
  const pal = style.palette;
  const accent = pal.accent;

  const goToDashboard = () => navigate(dashboardPath);
  const goToAccount = () => navigate(`${dashboardPath}?tab=account`);
  const goToAffiliate = () => (affiliatePath ? navigate(affiliatePath) : onOpenAffiliate?.());

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

  const linkClass = "px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors";

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-xl"
      style={{ background: `${pal.surface}e6`, borderColor: pal.cardBorder, color: pal.text, fontFamily: style.headingFont }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button onClick={() => scrollTo("store-listings")} className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={name} className="h-8 max-w-[180px] object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                <Store className="w-4.5 h-4.5" style={{ color: pal.accentText }} />
              </div>
              <span className="text-base font-bold uppercase tracking-wide truncate max-w-[180px]">{name}</span>
            </>
          )}
        </button>

        {/* Centered nav */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => scrollTo(item.target)}
              className={linkClass}
              style={{ color: pal.text }}
              onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = pal.text)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Cart */}
          <button onClick={() => onOpenCart?.()} className="relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors" style={{ borderColor: pal.cardBorder }} title="Cart">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: accent, color: pal.accentText }}>{cartCount}</span>
            )}
          </button>

          {customer ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                style={{ borderColor: pal.cardBorder }}
              >
                {customer.avatarUrl ? (
                  <img src={customer.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-xs font-bold uppercase tracking-wide max-w-[110px] truncate">{customer.fullName || customer.email}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border shadow-2xl shadow-black/40 py-2 z-50" style={{ background: pal.card, borderColor: pal.cardBorder }}>
                  <button onClick={() => { setAccountOpen(false); goToDashboard(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:opacity-80">
                    <User className="w-4 h-4 opacity-60" /> My Dashboard
                  </button>
                  <button onClick={() => { setAccountOpen(false); goToAccount(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:opacity-80">
                    <User className="w-4 h-4 opacity-60" /> My Account
                  </button>
                  {affiliateEnabled && (
                    <button onClick={() => { setAccountOpen(false); goToAffiliate(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:opacity-80">
                      <Share2 className="w-4 h-4 opacity-60" /> Affiliate Program
                    </button>
                  )}
                  <button onClick={() => { setAccountOpen(false); onLogout?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:opacity-80">
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth?.("login")}
              className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
              style={{ background: accent, color: pal.accentText }}
            >
              Connect
            </button>
          )}
        </div>

        {/* Mobile toggle + cart */}
        <div className="md:hidden flex items-center gap-1">
          <button onClick={() => onOpenCart?.()} className="relative p-2 rounded-lg" title="Cart">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: accent, color: pal.accentText }}>{cartCount}</span>
            )}
          </button>
          <button onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-lg">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t px-6 py-3 flex flex-col gap-1" style={{ background: pal.surface, borderColor: pal.cardBorder }}>
          {navItems.map((item) => (
            <button key={item.target} onClick={() => scrollTo(item.target)} className="text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide">
              {item.label}
            </button>
          ))}
          {customer ? (
            <>
              <button onClick={() => { setMenuOpen(false); goToDashboard(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide" style={{ borderColor: pal.cardBorder }}>
                <User className="w-4 h-4" /> My Dashboard
              </button>
              <button onClick={() => { setMenuOpen(false); goToAccount(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide" style={{ borderColor: pal.cardBorder }}>
                <User className="w-4 h-4" /> My Account
              </button>
              {affiliateEnabled && (
                <button onClick={() => { setMenuOpen(false); goToAffiliate(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide" style={{ borderColor: pal.cardBorder }}>
                  <Share2 className="w-4 h-4" /> Affiliate Program
                </button>
              )}
              <button onClick={() => { setMenuOpen(false); onLogout?.(); }} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide text-red-400" style={{ borderColor: pal.cardBorder }}>
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </>
          ) : (
            <button onClick={() => { setMenuOpen(false); onOpenAuth?.("login"); }} className="mt-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider" style={{ background: accent, color: pal.accentText }}>
              Connect
            </button>
          )}
        </nav>
      )}
    </header>
  );
}