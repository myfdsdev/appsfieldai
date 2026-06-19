import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Store, Globe } from "lucide-react";
import SaaSCard from "@/components/marketplace/SaaSCard";
import SaaSDetailModal from "@/components/marketplace/SaaSDetailModal";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";

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

  const { marketplace, software = [] } = data;
  const brandColor = marketplace.branding?.primaryColor || "#f97316";

  return (
    <div className="min-h-screen bg-background">
      {/* Store header */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
            {marketplace.branding?.logo ? (
              <img src={marketplace.branding.logo} alt={marketplace.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: brandColor }}>
                <Store className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold">{marketplace.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3.5 h-3.5" />{software.length} {software.length === 1 ? "listing" : "listings"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {software.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-display">No listings yet</p>
            <p className="text-sm mt-1">This store hasn't published any deals.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {software.map((l, i) => (
              <SaaSCard key={l.id} listing={l} delay={i * 0.05} onViewDetails={setViewDetailListing} />
            ))}
          </div>
        )}
      </div>

      <SaaSDetailModal
        listingId={viewDetailListing?.id}
        open={!!viewDetailListing}
        onClose={() => setViewDetailListing(null)}
      />
    </div>
  );
}