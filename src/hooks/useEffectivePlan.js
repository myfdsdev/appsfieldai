import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Boolean feature flags that should be OR-ed across every plan a user holds
// (having the feature on ANY held plan grants it).
const BOOLEAN_FEATURES = [
  "dfyAllowed",
  "customDomainAllowed",
  "multiVendorAllowed",
  "workspaceAllowed",
  "whiteLabelAllowed",
  "commissionModuleAllowed",
  "featuredListingsAllowed",
  "liveAuctionsAllowed",
  "vendorManagementAllowed",
  "myRequestsAllowed",
  "investmentsAllowed",
  "leadFinderAllowed",
  "marketingStudioAllowed",
  "customApiKeyAllowed",
  "telegramAllowed",
  "firstClientPackAllowed",
  "premiumTemplatesAccess",
];

// Numeric limits that should be summed across held plans. -1 means unlimited
// and wins over any finite sum.
const SUM_LIMITS = [
  "storeLimit",
  "productLimit",
  "dfyProductLimit",
  "marketplaceLimit",
  "vendorLimit",
  "customerLimit",
  "orderLimit",
  "storageLimit",
  "monthlyImageLimit",
  "monthlyVideoLimit",
];

// Merge a list of SubscriptionPlan records into one "effective" plan:
// booleans OR-ed, limits summed (-1 = unlimited), theme slugs unioned.
export function mergePlans(plans) {
  if (!plans || !plans.length) return null;
  const merged = {};

  for (const key of BOOLEAN_FEATURES) {
    merged[key] = plans.some((p) => !!p[key]);
  }

  for (const key of SUM_LIMITS) {
    let unlimited = false;
    let sum = 0;
    for (const p of plans) {
      const v = p[key];
      if (v === -1) unlimited = true;
      else if (typeof v === "number") sum += v;
    }
    merged[key] = unlimited ? -1 : sum;
  }

  // Union allowed theme slugs; empty on any plan means "all allowed".
  const anyAllAllowed = plans.some((p) => !p.allowedThemeSlugs || p.allowedThemeSlugs.length === 0);
  merged.allowedThemeSlugs = anyAllAllowed
    ? []
    : [...new Set(plans.flatMap((p) => p.allowedThemeSlugs || []))];

  merged.allowedDfyProductIds = [...new Set(plans.flatMap((p) => p.allowedDfyProductIds || []))];

  return merged;
}

// Resolves ALL plans a user holds (primary planId + JVZoo-stacked plans) and
// returns the merged effective plan plus the raw plan list. Use this anywhere
// feature access is gated so bundle + bump plans combine their entitlements.
export function useEffectivePlan(user) {
  const planIds = [...new Set([user?.planId, ...(user?.jvzooPlanIds || [])].filter(Boolean))];

  const { data: plans = [] } = useQuery({
    queryKey: ["effectivePlanPlans", planIds.sort().join(",")],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ id: { $in: planIds } }),
    enabled: planIds.length > 0,
  });

  return { plans, effectivePlan: mergePlans(plans) };
}