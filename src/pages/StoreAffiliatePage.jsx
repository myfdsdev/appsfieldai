import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store } from "lucide-react";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { useCustomCode } from "@/hooks/useCustomCode";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import StoreAffiliateLanding from "@/components/store/StoreAffiliateLanding";
import StoreAuthModal from "@/components/store/StoreAuthModal";
import StoreAffiliatePanel from "@/components/store/StoreAffiliatePanel";

export default function StoreAffiliatePage() {
  const { slug: slugParam } = useParams();
  const customDomain = getCustomDomainFromHost();
  const storeKey = getStoreKeyFromHost();
  const slug = slugParam || storeKey;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: "register" });
  const [affiliatePanelOpen, setAffiliatePanelOpen] = useState(false);

  const marketplaceId = data?.marketplace?.id;
  const { customer, setCustomer, logout } = useStoreCustomer(marketplaceId);

  useCustomCode(
    data?.marketplace?.pageSections?.customCodeHead,
    data?.marketplace?.pageSections?.customCodeBody
  );

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
      </div>
    );
  }

  const { marketplace, software = [], customPages = [] } = data;
  const storeBasePath = slugParam ? `/store/${slugParam}` : "";
  const brandColor = marketplace.branding?.primaryColor || "#f97316";
  const sections = marketplace.pageSections || {};
  const footerEnabled = sections.footerEnabled ?? true;
  const affiliateSettings = marketplace.affiliateSettings || null;
  const affiliateEnabled = !!affiliateSettings?.enabled;
  const storeBaseUrl = typeof window !== "undefined" ? `${window.location.origin}${storeBasePath}` : storeBasePath;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreNavbar
        marketplace={marketplace}
        sections={sections}
        customer={customer}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenAffiliate={() => (customer ? setAffiliatePanelOpen(true) : setAuthModal({ open: true, mode: "login" }))}
        affiliateEnabled={affiliateEnabled}
        dashboardPath={`${storeBasePath}/dashboard`}
        onLogout={logout}
      />

      <div className="flex-1">
        {affiliateEnabled ? (
          <StoreAffiliateLanding
            affiliateSettings={affiliateSettings}
            brandColor={brandColor}
            onApply={() => (customer ? setAffiliatePanelOpen(true) : setAuthModal({ open: true, mode: "register" }))}
          />
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-24 text-center">
            <h1 className="text-xl font-display font-bold">No affiliate program</h1>
            <p className="text-sm text-muted-foreground mt-1">This store doesn't have an affiliate program yet.</p>
          </div>
        )}
      </div>

      {footerEnabled && (
        <StoreFooter
          marketplace={marketplace}
          footerText={sections.footerText}
          footerLogoUrl={sections.footerLogoUrl}
          socialLinks={sections.socialLinks}
          customPages={customPages}
          storeBasePath={storeBasePath}
          affiliateEnabled={affiliateEnabled}
        />
      )}

      <StoreAuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        marketplace={marketplace}
        brandColor={brandColor}
        onClose={() => setAuthModal((a) => ({ ...a, open: false }))}
        onAuthed={(c) => setCustomer(c)}
      />

      {affiliateEnabled && (
        <StoreAffiliatePanel
          open={affiliatePanelOpen}
          marketplaceId={marketplaceId}
          affiliateSettings={affiliateSettings}
          listings={software}
          storeBaseUrl={storeBaseUrl}
          brandColor={brandColor}
          onClose={() => setAffiliatePanelOpen(false)}
        />
      )}
    </div>
  );
}