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
import StoreHero from "@/components/store/StoreHero";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreCategories from "@/components/store/StoreCategories";
import StoreVendorCTA from "@/components/store/StoreVendorCTA";
import StoreAuthModal from "@/components/store/StoreAuthModal";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";

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

  const marketplaceId = data?.marketplace?.id;
  const { customer, setCustomer, logout } = useStoreCustomer(marketplaceId);

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

  const { marketplace, software = [], reviews = [], customPages = [], testimonials = [] } = data;
  // On a path-based store (/store/:slug) keep the prefix; on a subdomain/custom domain it's root.
  const storeBasePath = slugParam ? `/store/${slugParam}` : "";
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const sections = marketplace.pageSections || {};
  const headerEnabled = sections.headerEnabled ?? true;
  const customBoxesEnabled = sections.customBoxesEnabled ?? false;
  const testimonialsEnabled = sections.testimonialsEnabled ?? false;
  const footerEnabled = sections.footerEnabled ?? true;

  return (
    <div className="min-h-screen bg-background">
      {/* Store top nav */}
      <StoreNavbar
        marketplace={marketplace}
        sections={sections}
        customer={customer}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
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
            <DealsEndingSoon listings={software} onViewDetails={setViewDetailListing} />
          </div>

          {/* Categories */}
          <StoreCategories listings={software} brandColor={brandColor} onSelect={handleSelectCategory} />

          {/* Lifetime Deals (searchable grid of all store products) */}
          <div id="store-lifetime-deals">
            <OneInALifetimeDeals
              listings={categoryFilter ? software.filter(l => l.category === categoryFilter) : software}
              onViewDetails={setViewDetailListing}
            />
          </div>

          {/* Become A Vendor? */}
          <StoreVendorCTA marketplace={marketplace} brandColor={brandColor} />
        </>
      )}

      {/* Testimonials */}
      {testimonialsEnabled && <StoreTestimonials testimonials={testimonials} reviews={reviews} brandColor={brandColor} title={sections.testimonialsTitle} />}

      {/* Custom Section */}
      {customBoxesEnabled && <StoreCustomSection boxes={sections.customBoxes} brandColor={brandColor} />}

      {/* Footer */}
      {footerEnabled && <StoreFooter marketplace={marketplace} footerText={sections.footerText} customPages={customPages} storeBasePath={storeBasePath} />}

      <SaaSDetailModal
        listingId={viewDetailListing?.id}
        open={!!viewDetailListing}
        onClose={() => setViewDetailListing(null)}
      />

      <StoreAuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        marketplace={marketplace}
        brandColor={brandColor}
        onClose={() => setAuthModal((a) => ({ ...a, open: false }))}
        onAuthed={(c) => setCustomer(c)}
      />
    </div>
  );
}