import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, Menu, X, User, LogOut, ChevronDown, ShoppingCart, Heart, Search, Share2, Rocket } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

// Appsfield store navbar: orange promo bar + white sticky header (logo, search,
// wishlist/cart/account) + a category nav strip. Mirrors the reference layout
// while wiring into the store's real customer/cart/affiliate actions.
export default function StoreAppsfieldNavbar({
  marketplace, sections = {}, customer, onOpenAuth, onLogout, onOpenAffiliate,
  affiliateEnabled = false, affiliatePath, cartCount = 0, onOpenCart, dashboardPath = "/dashboard",
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const goToDashboard = () => navigate(dashboardPath);
  const goToAccount = () => navigate(`${dashboardPath}?tab=account`);
  const goToAffiliate = () => (affiliatePath ? navigate(affiliatePath) : onOpenAffiliate?.());

  const lightLogo = marketplace.branding?.logo;
  const darkLogo = marketplace.branding?.logoDark;
  const themedLogo = theme === "dark" ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const logo = sections.headerLogoUrl || themedLogo;
  const name = marketplace.name || "Store";
  const [promoOpen, setPromoOpen] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  const navItems = [
    { label: "Best Sellers", target: "store-best-sellers" },
    { label: "Categories", target: "store-categories" },
    { label: "Lifetime Deals", target: "store-lifetime-deals" },
    ...(marketplace.type === "multi_vendor" ? [{ label: "Become A Vendor?", target: "store-become-vendor" }] : []),
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Promo bar */}
      {promoOpen && (sections.heroBadgeText || true) && (
        <div className="bg-[#FF6B00] text-white text-xs sm:text-sm py-2 px-4 relative text-center font-medium">
          <span>🚀 {sections.headerSubtitle ? "Launch deals are live now — grab lifetime access." : `Welcome to ${name} — lifetime software deals, live now.`}</span>
          <button onClick={() => setPromoOpen(false)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo + mobile toggle */}
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-1 text-[#6B7280] hover:text-[#FF6B00]" onClick={() => setMenuOpen((o) => !o)}>
                <Menu className="w-6 h-6" />
              </button>
              <button onClick={() => scrollTo("store-listings")} className="font-bold text-2xl sm:text-3xl text-[#161616] tracking-tight flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {logo ? (
                  <img src={logo} alt={name} className="h-9 max-w-[200px] object-contain" />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <span className="truncate max-w-[220px]">{name}</span>
                  </>
                )}
              </button>
            </div>

            {/* Search (visual — focuses the deals search below) */}
            <div className="hidden lg:flex flex-1 max-w-2xl">
              <button
                onClick={() => scrollTo("store-lifetime-deals")}
                className="flex w-full border-2 border-[#E5E7EB] rounded-lg overflow-hidden transition hover:border-[#FF6B00] text-left"
              >
                <div className="px-3 flex items-center bg-gray-50 text-[#6B7280]"><Search className="w-5 h-5" /></div>
                <span className="w-full py-2.5 px-2 text-sm text-[#6B7280]">Search software, AI tools and lifetime deals</span>
                <span className="bg-[#FF6B00] text-white px-6 font-semibold flex items-center text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Search</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              {affiliateEnabled && (
                <button onClick={goToAffiliate} className="hidden xl:flex text-sm font-medium text-[#6B7280] hover:text-[#FF6B00] transition items-center gap-1">
                  <Share2 className="w-4 h-4" /> Affiliates
                </button>
              )}
              <button className="relative p-2 text-[#6B7280] hover:text-[#FF6B00] transition hidden sm:block">
                <Heart className="w-6 h-6" />
              </button>
              <button onClick={onOpenCart} className="relative p-2 text-[#6B7280] hover:text-[#FF6B00] transition flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 -right-1 min-w-[20px] h-5 px-1 bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>
                )}
                <span className="hidden sm:block font-semibold text-sm text-[#161616]" style={{ fontFamily: "'Outfit', sans-serif" }}>Cart</span>
              </button>

              {/* Account */}
              {customer ? (
                <div className="relative" ref={accountRef}>
                  <button onClick={() => setAccountOpen((o) => !o)} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F7F7F7] transition">
                    {customer.avatarUrl ? (
                      <img src={customer.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center"><User className="w-3.5 h-3.5 text-white" /></div>
                    )}
                    <span className="text-sm font-medium max-w-[110px] truncate hidden sm:block text-[#161616]">{customer.fullName || customer.email}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-2 z-50">
                      <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1">
                        <p className="text-sm font-medium truncate text-[#161616]">{customer.fullName || "Customer"}</p>
                        <p className="text-[11px] text-[#6B7280] truncate">{customer.email}</p>
                      </div>
                      <button onClick={() => { setAccountOpen(false); goToDashboard(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#161616] hover:bg-[#F7F7F7] transition"><User className="w-4 h-4 text-[#6B7280]" /> My Dashboard</button>
                      <button onClick={() => { setAccountOpen(false); goToAccount(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#161616] hover:bg-[#F7F7F7] transition"><User className="w-4 h-4 text-[#6B7280]" /> My Account</button>
                      {affiliateEnabled && (
                        <button onClick={() => { setAccountOpen(false); goToAffiliate(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#161616] hover:bg-[#F7F7F7] transition"><Share2 className="w-4 h-4 text-[#6B7280]" /> Affiliate Program</button>
                      )}
                      <button onClick={() => { setAccountOpen(false); onLogout?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition border-t border-[#E5E7EB] mt-1"><LogOut className="w-4 h-4" /> Log out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => onOpenAuth?.("login")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F7F7F7] transition text-[#161616]">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center"><User className="w-3.5 h-3.5 text-white" /></div>
                  <span className="text-sm font-medium hidden sm:block">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category nav strip */}
      <nav className="bg-white border-b border-[#F7F7F7] hidden lg:block shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-8">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.target}>
                <button onClick={() => scrollTo(item.target)} className="block py-4 text-sm font-semibold text-[#161616] hover:text-[#FF6B00] transition" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {item.label}
                </button>
              </li>
            ))}
            <li className="ml-auto">
              <button onClick={() => scrollTo("store-listings")} className="py-4 text-sm font-semibold text-[#FF6B00] hover:text-orange-700 transition flex items-center gap-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Browse All Deals
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F7F7F7]">
              <span className="font-bold text-xl text-[#161616]" style={{ fontFamily: "'Outfit', sans-serif" }}>Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-2"><X className="w-5 h-5 text-[#161616]" /></button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <button key={item.target} onClick={() => scrollTo(item.target)} className="text-left font-semibold text-[#161616] border-b border-[#F7F7F7] pb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {item.label}
                </button>
              ))}
              {customer ? (
                <>
                  <button onClick={() => { setMenuOpen(false); goToDashboard(); }} className="flex items-center gap-2 py-2 text-sm font-medium text-[#161616]"><User className="w-4 h-4" /> My Dashboard</button>
                  {affiliateEnabled && <button onClick={() => { setMenuOpen(false); goToAffiliate(); }} className="flex items-center gap-2 py-2 text-sm font-medium text-[#161616]"><Share2 className="w-4 h-4" /> Affiliate Program</button>}
                  <button onClick={() => { setMenuOpen(false); onLogout?.(); }} className="flex items-center gap-2 py-2 text-sm font-medium text-red-500"><LogOut className="w-4 h-4" /> Log out</button>
                </>
              ) : (
                <button onClick={() => { setMenuOpen(false); onOpenAuth?.("login"); }} className="flex items-center gap-2 py-2 text-sm font-medium text-[#161616]"><User className="w-4 h-4" /> Login</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}