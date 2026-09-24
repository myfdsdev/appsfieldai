import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import { getStoreStyle, loadStyleFonts } from "@/components/store/storeStyles";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { listingPrice } from "@/hooks/useStoreCart";
import { useCurrencyRates } from "@/lib/useCurrencyRates";
import { usePaymentReturn } from "@/hooks/usePaymentReturn";
import { useCustomCode } from "@/hooks/useCustomCode";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getRefFromUrl, saveAffiliateRef } from "@/lib/affiliateRef";
import SalesTopBar from "@/components/store/salespage/SalesTopBar";
import SalesHero from "@/components/store/salespage/SalesHero";
import SalesDetails from "@/components/store/salespage/SalesDetails";
import SalesCta from "@/components/store/salespage/SalesCta";
import StoreCheckoutModal from "@/components/store/StoreCheckoutModal";
import StoreFooter from "@/components/store/StoreFooter";

// Dedicated, shareable mini sales page for a single store product.
export default function ProductSalesPage() {
  const { slug: slugParam, id } = useParams();
  const customDomain = getCustomDomainFromHost();
  const slug = slugParam || getStoreKeyFromHost();
  const storeBasePath = slugParam ? `/store/${slugParam}` : "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions.invoke("getMarketplacePublic", { slug, customDomain })
      .then((res) => active && setData(res.data?.marketplace ? res.data : null))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug, customDomain]);

  const marketplace = data?.marketplace;
  const marketplaceId = marketplace?.id;
  const listing = data?.software?.find((l) => l.id === id);
  const sections = marketplace?.pageSections || {};
  const { customer } = useStoreCustomer(marketplaceId);
  const { format } = useCurrencyRates(marketplace?.currency || "USD");

  usePaymentReturn(marketplaceId, () => toast.success("Check your email for your access details."));
  useCustomCode(sections.customCodeHead, sections.customCodeBody);
  useSeoMeta({
    title: listing ? `${listing.softwareName} — ${marketplace.name}` : undefined,
    description: listing?.shortDescription,
    image: listing?.screenshots?.[0] || listing?.logo,
    url: listing ? window.location.href.split("?")[0] : undefined,
  });

  useEffect(() => {
    if (!marketplaceId) return;
    const ref = getRefFromUrl();
    if (ref) saveAffiliateRef(marketplaceId, ref);
    loadStyleFonts(getStoreStyle(sections.storeStyle));
  }, [marketplaceId]); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-xl font-display font-bold">Product not found</h1>
        <p className="text-sm text-muted-foreground mt-1">This product may have been removed or isn't published yet.</p>
        {marketplace && <Link to={storeBasePath || "/"} className="mt-4 text-sm font-semibold text-primary">Browse the store →</Link>}
      </div>
    );
  }

  const style = getStoreStyle(sections.storeStyle);
  const pal = style.palette;
  const t = {
    accent: pal?.accent || marketplace.branding?.primaryColor || "#f97316",
    accentText: pal?.accentText || "#ffffff",
    cardStyle: pal ? { background: pal.card, borderColor: pal.cardBorder, color: pal.text } : undefined,
    headingStyle: style.headingFont ? { fontFamily: style.headingFont } : undefined,
  };
  const price = listingPrice(listing);
  const priceLabel = format(price);
  const buyItems = [{ listingId: listing.id, listingTitle: listing.softwareName, unitPrice: price, quantity: 1 }];
  const openCheckout = () => setCheckoutOpen(true);

  return (
    <div
      className="min-h-screen bg-background text-foreground pb-20 lg:pb-0"
      style={{ fontFamily: style.bodyFont, "--sp-accent": t.accent, ...(pal ? { background: pal.surface, color: pal.text } : {}) }}
    >
      <SalesTopBar marketplace={marketplace} storeHome={storeBasePath || "/"} title={listing.softwareName} />
      <SalesHero listing={listing} t={t} priceLabel={priceLabel} onBuy={openCheckout} />
      <SalesDetails listing={listing} t={t} />

      {/* Final call to action */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <div className="rounded-3xl p-8 md:p-10 text-center border border-border/40 bg-card" style={t.cardStyle}>
          <h2 className="text-2xl md:text-3xl font-display font-bold" style={t.headingStyle}>Ready to get {listing.softwareName}?</h2>
          <p className="opacity-75 mt-2">Grab it today for just <span className="font-bold" style={{ color: t.accent }}>{priceLabel}</span>.</p>
          <SalesCta listing={listing} priceLabel={priceLabel} accent={t.accent} accentText={t.accentText} onBuy={openCheckout} className="mt-6 h-12 px-8 text-base" />
        </div>
      </section>

      {(sections.footerEnabled ?? true) && (
        <StoreFooter marketplace={marketplace} footerText={sections.footerText} footerLogoUrl={sections.footerLogoUrl} socialLinks={sections.socialLinks} customPages={data.customPages || []} storeBasePath={storeBasePath} affiliateEnabled={!!marketplace.affiliateSettings?.enabled} styleSlug={sections.storeStyle} />
      )}

      {/* Sticky mobile buy bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 border-t border-border/40 bg-background/95 backdrop-blur" style={pal ? { background: pal.surface } : undefined}>
        <SalesCta listing={listing} priceLabel={priceLabel} accent={t.accent} accentText={t.accentText} onBuy={openCheckout} className="w-full h-11 text-sm" />
      </div>

      <StoreCheckoutModal
        open={checkoutOpen}
        items={buyItems}
        total={price}
        marketplace={marketplace}
        customer={customer}
        brandColor={t.accent}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}