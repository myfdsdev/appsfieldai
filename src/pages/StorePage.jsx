import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store } from "lucide-react";
import SaaSDetailModal from "@/components/marketplace/SaaSDetailModal";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import DealsEndingSoon from "@/components/store/DealsEndingSoon";
import OneInALifetimeDeals from "@/components/store/OneInALifetimeDeals";
import StoreTestimonials from "@/components/store/StoreTestimonials";
import StoreCustomSection from "@/components/store/StoreCustomSection";
import StoreFooter from "@/components/store/StoreFooter";
import StoreFAQ from "@/components/store/StoreFAQ";
import StoreHero from "@/components/store/StoreHero";
import StoreStatsBar from "@/components/store/StoreStatsBar";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreCategories from "@/components/store/StoreCategories";
import StoreVendorCTA from "@/components/store/StoreVendorCTA";
import StoreAuthModal from "@/components/store/StoreAuthModal";
import StoreAccountPanel from "@/components/store/StoreAccountPanel";
import StoreReserveModal from "@/components/store/StoreReserveModal";
import StoreCartDrawer from "@/components/store/StoreCartDrawer";
import StoreCheckoutModal from "@/components/store/StoreCheckoutModal";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { useStoreCart } from "@/hooks/useStoreCart";
import { toast } from "sonner";

export default function StorePage() {
  const { slug: slugParam } = useParams();
  // A customer's own domain (e.g. deals.brand.com) resolves the store by customDomain.
  const customDomain = getCustomDomainFromHost();
  // On a wildcard store subdomain the key comes from the hostname, not the path.
  const slug = slugParam || getStoreKeyFromHost();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewDetailListing, setViewDetailListing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [accountPanel, setAccountPanel] = useState({ open: false, tab: "account" });
  const [reserveListing, setReserveListing] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const marketplaceId = data?.marketplace?.id;
  const { customer, setCustomer, logout } = useStoreCustomer(marketplaceId);
  const cart = useStoreCart(marketplaceId);

  // Reserve a spot: must be signed in. Opens the store reserve modal.
  const handleReserve = (listing) => {
    if (!customer) { setAuthModal({ open: true, mode: "login" }); return; }
    setReserveListing(listing);
  };

  // Add to cart — open for everyone (account only required at checkout).
  const handleAddToCart = (listing) => {
    cart.addItem(listing, 1);
    toast.success(`${listing.softwareName} added to cart`);
  };

  // Buy Now — add to cart then go straight to checkout (must be signed in).
  const handleBuyNow = (listing) => {
    cart.addItem(listing, 1);
    if (!customer) { setAuthModal({ open: true, mode: "login" }); return; }
    setCheckoutOpen(true);
  };

  // Checkout from the cart drawer — requires sign-in.
  const handleCheckout = () => {
    if (!customer) { setCartOpen(false); setAuthModal({ open: true, mode: "login" }); return; }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleSelectCategory = (cat) => {
    setCategoryFilter(prev => (prev === cat ? null : cat));
    document.getElementById("store-listings")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("getMarketplacePublic", { slug, customDomain })
      .then((res) => {
        if (!active) return;
        if (res.data?.error || !res.data?.marketplace) setNotFound(true);
        else setData(res.data);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug, customDomain]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold">Store not found</h1>
        <p className="text-sm text-muted-foreground mt-1">{customDomain ? `No store is connected to ${customDomain} yet.` : `The store "${slug}" doesn't exist or isn't published yet.`}</p>
      </div>
    );
  }

  const { marketplace, software = [], reviews = [], customPages = [], testimonials = [], categories = [] } = data;
  // Saved categories = SoftwareCategory records + simple categories from setup.
  const savedCategories = [
    ...categories.map((c) => c.name).filter(Boolean),
    ...(marketplace.categories || []),
  ];
  // On a path-based store (/store/:slug) keep the prefix; on a subdomain/custom domain it's root.
  const storeBasePath = slugParam ? `/store/${slugParam}` : "";
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const sections = marketplace.pageSections || {};
  const headerEnabled = sections.headerEnabled ?? true;
  const customBoxesEnabled = sections.customBoxesEnabled ?? false;
  const testimonialsEnabled = sections.testimonialsEnabled ?? false;
  const footerEnabled = sections.footerEnabled ?? true;
  const faqEnabled = sections.faqEnabled ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Store top nav */}
      <StoreNavbar
        marketplace={marketplace}
        sections={sections}
        customer={customer}
        cartCount={cart.count}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        dashboardPath={`${storeBasePath}/dashboard`}
        onLogout={logout}
      />

      {/* Store hero */}
      {headerEnabled && (
        <StoreHero marketplace={marketplace} sections={sections} listingsCount={software.length} />
      )}

      {/* Stats bar */}
      {(sections.statsBarEnabled ?? false) && (
        <StoreStatsBar title={sections.statsBarTitle} cards={sections.statsCards} brandColor={brandColor} />
      )}

      <div id="store-listings" />

      {software.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-display">No listings yet</p>
            <p className="text-sm mt-1">This store hasn't published any deals.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Best Sellers / 🔥 Deals Ending Soon */}
          <div id="store-best-sellers">
            <DealsEndingSoon listings={software} onViewDetails={setViewDetailListing} onReserveSpot={handleReserve} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
          </div>

          {/* Categories */}
          <StoreCategories listings={software} savedCategories={savedCategories} brandColor={brandColor} onSelect={handleSelectCategory} />

          {/* Lifetime Deals (searchable grid of all store products) */}
          <div id="store-lifetime-deals">
            <OneInALifetimeDeals
              listings={categoryFilter ? software.filter(l => l.category === categoryFilter) : software}
              title={sections.productsSectionTitle}
              subtitle={sections.productsSectionSubtitle}
              onViewDetails={setViewDetailListing}
              onReserveSpot={handleReserve}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>

          {/* Become A Vendor? — only on multi-vendor stores */}
          {marketplace.type === "multi_vendor" && (
            <StoreVendorCTA marketplace={marketplace} brandColor={brandColor} />
          )}
        </>
      )}

      {/* Testimonials */}
      {testimonialsEnabled && <StoreTestimonials testimonials={testimonials} reviews={reviews} brandColor={brandColor} title={sections.testimonialsTitle} />}

      {/* Custom Section */}
      {customBoxesEnabled && <StoreCustomSection boxes={sections.customBoxes} brandColor={brandColor} />}

      {/* Footer */}
      {footerEnabled && <StoreFooter marketplace={marketplace} footerText={sections.footerText} customPages={customPages} storeBasePath={storeBasePath} />}

      {/* FAQ — below the footer */}
      {faqEnabled && <StoreFAQ faqs={sections.faqs} title={sections.faqTitle} brandColor={brandColor} />}

      <SaaSDetailModal
        listingId={viewDetailListing?.id}
        open={!!viewDetailListing}
        sellerName={viewDetailListing?.resolvedSellerName}
        onClose={() => setViewDetailListing(null)}
        onAddToCart={(l) => { handleAddToCart(l); setViewDetailListing(null); }}
        onBuyNow={(l) => { setViewDetailListing(null); handleBuyNow(l); }}
        requireAuth={() => {
          if (customer) return true;
          // Visitor must log in / sign up before buying or reserving a spot.
          setAuthModal({ open: true, mode: "login" });
          return false;
        }}
      />

      <StoreAuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        marketplace={marketplace}
        brandColor={brandColor}
        onClose={() => setAuthModal((a) => ({ ...a, open: false }))}
        onAuthed={(c) => setCustomer(c)}
      />

      <StoreReserveModal
        open={!!reserveListing}
        listing={reserveListing}
        marketplaceId={marketplaceId}
        customer={customer}
        brandColor={brandColor}
        onClose={() => setReserveListing(null)}
        onReserved={() => setAccountPanel({ open: true, tab: "products" })}
      />

      <StoreAccountPanel
        open={accountPanel.open}
        initialTab={accountPanel.tab}
        marketplaceId={marketplaceId}
        customer={customer}
        brandColor={brandColor}
        onClose={() => setAccountPanel((a) => ({ ...a, open: false }))}
        onLogout={logout}
      />

      <StoreCartDrawer
        open={cartOpen}
        cart={cart}
        brandColor={brandColor}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <StoreCheckoutModal
        open={checkoutOpen}
        items={cart.items}
        total={cart.total}
        marketplace={marketplace}
        customer={customer}
        brandColor={brandColor}
        onClose={() => setCheckoutOpen(false)}
        onPlaced={() => { cart.clear(); }}
      />
    </div>
  );
}