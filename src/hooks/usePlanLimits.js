import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const STATIC_PLANS = {
  starter: { marketplaceLimit: 1, listingLimit: 10, vendorLimit: 5, customDomainAllowed: false },
  pro: { marketplaceLimit: 3, listingLimit: 50, vendorLimit: 25, customDomainAllowed: true },
  agency: { marketplaceLimit: 10, listingLimit: 0, vendorLimit: 100, customDomainAllowed: true },
  enterprise: { marketplaceLimit: 0, listingLimit: 0, vendorLimit: 0, customDomainAllowed: true },
};

export function usePlanLimits() {
  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  
  const { data: activeSub } = useQuery({
    queryKey: ["userSubscription", currentUser?.id],
    queryFn: () => base44.entities.UserSubscription.filter({ userId: currentUser?.id, status: "active" }),
    enabled: !!currentUser?.id,
  });

  const { data: marketplaces = [] } = useQuery({
    queryKey: ["ownerMarketplaces", currentUser?.id],
    queryFn: () => base44.entities.Marketplace.filter({ ownerId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["userListings", currentUser?.id],
    queryFn: () => base44.entities.SaaSListing.filter({ ownerId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["userVendors", currentUser?.id],
    queryFn: () => base44.entities.Vendor.filter({ userId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const planKey = activeSub?.[0]?.planName?.toLowerCase() || "starter";
  const limits = STATIC_PLANS[planKey] || STATIC_PLANS.starter;
  const planName = activeSub?.[0]?.planName || "Starter";

  const canCreateMarketplace = limits.marketplaceLimit === 0 || marketplaces.length < limits.marketplaceLimit;
  const canCreateListing = limits.listingLimit === 0 || listings.length < limits.listingLimit;
  const canCreateVendor = limits.vendorLimit === 0 || vendors.length < limits.vendorLimit;

  const getMarketplaceCount = () => marketplaces.length;
  const getListingCount = () => listings.length;
  const getVendorCount = () => vendors.length;

  return {
    planName,
    limits,
    canCreateMarketplace,
    canCreateListing,
    canCreateVendor,
    getMarketplaceCount,
    getListingCount,
    getVendorCount,
    activeSubscription: activeSub?.[0],
  };
}