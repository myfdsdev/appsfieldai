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
import StoreTrustBadges from "@/components/store/StoreTrustBadges";
import StoreFAQ from "@/components/store/StoreFAQ";
import { useCustomCode } from "@/hooks/useCustomCode";
import StoreHero from "@/components/store/StoreHero";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreCategories from "@/components/store/StoreCategories";
import StoreVendorCTA from "@/components/store/StoreVendorCTA";
import StoreAuthModal from "@/components/store/StoreAuthModal";
import StoreAccountPanel from "@/components/store/StoreAccountPanel";
import { fetchAffiliateApplications, capturePaypalOrder } from "@/lib/storeCustomerAuth";
import StoreReserveModal from "@/components/store/StoreReserveModal";
import StoreCartDrawer from "@/components/store/StoreCartDrawer";
import StoreCheckoutModal from "@/components/store/StoreCheckoutModal";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { useStoreCart } from "@/hooks/useStoreCart";
import { getRefFromUrl, saveAffiliateRef } from "@/lib/affiliateRef";
import DealMakerWidget from "@/components/store/dealmaker/DealMakerWidget";
import { getStoreStyle, loadStyleFonts } from "@/components/store/storeStyles";
import { toast } from "sonner";

export default function StorePage() {
  const { slug: slugParam, id: deepLinkListingId } = useParams();
  // A customer's own domain (e.g. deals.brand.com) resolves the store by customDomain.
  const customDomain = getCustomDomainFromHost();
  // On a wildcard store subdomain the key comes from the hostname, not the path.
  const slug = slugParam || getStoreKeyFromHost();

  // When on the path-based platform URL (app.appsfieldai.com/store/:slug), check
  // whether this store has an active, verified custom domain and redirect there
  // instead. Blocks rendering while checking so the platform-hosted page never
  // flashes first. Fails open (no redirect) on any error/timeout/missing config
  // so an outage in the custom-domain-service never breaks the platform store.
  const [checkingRedirect, setCheckingRedirect] = useState(!customDomain && !!slugParam);
  useEffect(() => {
    if (customDomain || !slugParam) { setCheckingRedirect(false); return; }
    const serviceUrl = import.meta.env.VITE_DOMAIN_SERVICE_URL || "https://app.appsfieldai.onrender.com";
    if (!serviceUrl) { setCheckingRedirect(false); return; }
    let active = true;
    fetch(`${serviceUrl}/api/domain-for-store?slug=${encodeURIComponent(slugParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (!active) return;
        if (info?.customDomain && info?.redirectEnabled) {
          const suffix = window.location.pathname.replace(`/store/${slugParam}`, "") || "/";
          window.location.replace(`https://${info.customDomain}${suffix}${window.location.search}`);
          return;
        }
        setCheckingRedirect(false);
      })
      .catch(() => { if (active) setCheckingRedirect(false); });
    return () => { active = false; };
  }, [slugParam, customDomain]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewDetailListing, setViewDetailListing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [accountPanel, setAccountPanel] = useState({ open: false, tab: "account" });
  // Approved affiliate applications for the logged-in customer → drives "Grab affiliate link" buttons.
  const [affiliateInfo, setAffiliateInfo] = useState({ refCode: null, approvedIds: new Set() });
  const [reserveListing, setReserveListing] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const marketplaceId = data?.marketplace?.id;
  const { customer, setCustomer, logout } = useStoreCustomer(marketplaceId);
  const cart = useStoreCart(marketplaceId);

  // Load the customer's affiliate applications so approved products show a "Grab affiliate link" button.
  const loadAffiliateInfo = React.useCallback(() => {
    if (!marketplaceId || !customer) { setAffiliateInfo({ refCode: null, approvedIds: new Set() }); return; }
    fetchAffiliateApplications(marketplaceId).then((res) => {
      const approvedIds = new Set((res?.applications || []).filter((a) => a.status === "approved").map((a) => a.listingId));
      setAffiliateInfo({ refCode: res?.refCode || null, approvedIds });
    });
  }, [marketplaceId, customer]);

  useEffect(() => { loadAffiliateInfo(); }, [loadAffiliateInfo]);

  // Capture an affiliate referral code (?ref=) and persist it for this store so
  // the referring affiliate is credited when this visitor eventually buys.
  useEffect(() => {
    if (!marketplaceId) return;
    const ref = getRefFromUrl();
    if (ref) saveAffiliateRef(marketplaceId, ref);
  }, [marketplaceId]);

  // Load the Google Fonts for the store's selected visual style.
  useEffect(() => {
    if (data?.marketplace) loadStyleFonts(getStoreStyle(data.marketplace.pageSections?.storeStyle));
  }, [data]);

  // Deep link from a referral link (/saas/:id) → open that product's detail modal.
  useEffect(() => {
    if (!deepLinkListingId || !data?.software) return;
    const listing = data.software.find((l) => l.id === deepLinkListingId);
    if (listing) setViewDetailListing(listing);
  }, [deepLinkListingId, data]);

  // Returning from PayPal approval (?paypal=<orderId>) → capture the payment.
  useEffect(() => {
    if (!marketplaceId) return;
    const params = new URLSearchParams(window.location.search);
    const paypalOrderId = params.get("paypal");
    if (params.get("paypal_cancel")) {
      toast.error("PayPal payment was cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (!paypalOrderId) return;
    // Clean the URL so a refresh doesn't re-trigger.
    window.history.replaceState({}, "", window.location.pathname);
    capturePaypalOrder({ marketplaceId, paypalOrderId })
      .then(() => {
        toast.success("Payment successful! Your order is confirmed.");
        setAccountPanel({ open: true, tab: "account" });
      })
      .catch((e) => toast.error(e.message || "We couldn't confirm your PayPal payment."));
  }, [marketplaceId]);

  // Inject the store owner's custom head/body code (FB/Google pixel, analytics, etc.).
  useCustomCode(
    data?.marketplace?.pageSections?.customCodeHead,
    data?.marketplace?.pageSections?.customCodeBody
  );

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

  if (checkingRedirect || loading) {
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
  // Resolve the store's chosen visual style and load its fonts.
  const storeStyle = getStoreStyle(sections.storeStyle);
  const headerEnabled = sections.headerEnabled ?? true;
  const customBoxesEnabled = sections.customBoxesEnabled ?? false;
  const testimonialsEnabled = sections.testimonialsEnabled ?? false;
  const footerEnabled = sections.footerEnabled ?? true;
  const faqEnabled = sections.faqEnabled ?? false;
  const trustBadgesEnabled = sections.trustBadgesEnabled ?? false;
  const affiliateSettings = marketplace.affiliateSettings || null;
  const affiliateEnabled = !!affiliateSettings?.enabled;
  // Base URL for referral links — on a subdomain/custom domain it's the origin root,
  // on a path-based store it includes /store/:slug.
  const storeBaseUrl = typeof window !== "undefined" ? `${window.location.origin}${storeBasePath}` : storeBasePath;
  // Per-product affiliate link — only for products the customer is an approved affiliate on.
  const affiliateLinkFor = (listing) =>
    affiliateInfo.refCode && affiliateInfo.approvedIds.has(listing.id)
      ? `${storeBaseUrl}/saas/${listing.id}?ref=${affiliateInfo.refCode}`
      : null;

  // A style may define a full color palette (e.g. Nitro's dark-green + lime look)
  // that overrides the page surface across every section.
  const pal = storeStyle.palette;

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: storeStyle.bodyFont, ...(pal ? { background: pal.surface, color: "#e8f0df" } : {}) }}
    >
      {/* Store top nav */}
      <StoreNavbar
        marketplace={marketplace}
        sections={sections}
        customer={customer}
        cartCount={cart.count}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        affiliateEnabled={affiliateEnabled}
        affiliatePath={`${storeBasePath}/affiliates`}
        dashboardPath={`${storeBasePath}/dashboard`}
        onLogout={logout}
      />

      {/* Store hero */}
      {headerEnabled && (
        <StoreHero marketplace={marketplace} sections={sections} listingsCount={software.length} />
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
            <DealsEndingSoon listings={software} styleSlug={sections.storeStyle} onViewDetails={setViewDetailListing} onReserveSpot={handleReserve} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} affiliateLinkFor={affiliateLinkFor} />
          </div>

          {/* Categories */}
          <StoreCategories listings={software} savedCategories={savedCategories} brandColor={brandColor} onSelect={handleSelectCategory} />

          {/* Lifetime Deals (searchable grid of all store products) */}
          <div id="store-lifetime-deals">
            <OneInALifetimeDeals
              listings={categoryFilter ? software.filter(l => l.category === categoryFilter) : software}
              title={sections.productsSectionTitle}
              subtitle={sections.productsSectionSubtitle}
              styleSlug={sections.storeStyle}
              currency={marketplace.currency}
              onViewDetails={setViewDetailListing}
              onReserveSpot={handleReserve}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              affiliateLinkFor={affiliateLinkFor}
            />
          </div>

          {/* Become A Vendor? — only on multi-vendor stores */}
          {marketplace.type === "multi_vendor" && (
            <StoreVendorCTA marketplace={marketplace} brandColor={brandColor} />
          )}
        </>
      )}

      {/* Trust / policy badges */}
      {trustBadgesEnabled && <StoreTrustBadges badges={sections.trustBadges} title={sections.trustBadgesTitle} brandColor={pal?.accent || brandColor} styleSlug={sections.storeStyle} />}

      {/* Testimonials */}
      {testimonialsEnabled && <StoreTestimonials testimonials={testimonials} reviews={reviews} brandColor={pal?.accent || brandColor} title={sections.testimonialsTitle} styleSlug={sections.storeStyle} />}

      {/* Custom Section */}
      {customBoxesEnabled && <StoreCustomSection boxes={sections.customBoxes} brandColor={brandColor} />}

      {/* Footer */}
      {footerEnabled && <StoreFooter marketplace={marketplace} footerText={sections.footerText} footerLogoUrl={sections.footerLogoUrl} socialLinks={sections.socialLinks} customPages={customPages} storeBasePath={storeBasePath} affiliateEnabled={affiliateEnabled} />}

      {/* FAQ — below the footer */}
      {faqEnabled && <StoreFAQ faqs={sections.faqs} title={sections.faqTitle} brandColor={pal?.accent || brandColor} styleSlug={sections.storeStyle} />}

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
        setCustomer={setCustomer}
        brandColor={brandColor}
        affiliateEnabled={affiliateEnabled}
        affiliatePath={`${storeBasePath}/affiliates`}
        affiliateSettings={affiliateSettings}
        storeBaseUrl={storeBaseUrl}
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

      {/* Deal Maker Agent — pops up, then collapses to a top pill */}
      {(sections.dealMakerEnabled ?? true) && (
        <DealMakerWidget
          marketplaceId={marketplaceId}
          marketplace={marketplace}
          listings={software}
          brandColor={brandColor}
          onShowApp={(listing) => setViewDetailListing(listing)}
          onReserve={(listing) => handleReserve(listing)}
        />
      )}
    </div>
  );
}