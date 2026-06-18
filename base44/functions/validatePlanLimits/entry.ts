import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STATIC_PLANS = {
  starter: { marketplaceLimit: 1, listingLimit: 10, vendorLimit: 5 },
  pro: { marketplaceLimit: 3, listingLimit: 50, vendorLimit: 25 },
  agency: { marketplaceLimit: 10, listingLimit: 0, vendorLimit: 100 },
  enterprise: { marketplaceLimit: 0, listingLimit: 0, vendorLimit: 0 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { resourceType } = body;

    if (!resourceType || !["marketplace", "listing", "vendor"].includes(resourceType)) {
      return Response.json({ error: "Invalid resource type" }, { status: 400 });
    }

    // Get user's active subscription
    const subscriptions = await base44.entities.UserSubscription.filter({ 
      userId: user.id, 
      status: "active" 
    });
    
    const planKey = subscriptions[0]?.planName?.toLowerCase() || "starter";
    const limits = STATIC_PLANS[planKey] || STATIC_PLANS.starter;

    // Count current resources
    let currentCount = 0;
    if (resourceType === "marketplace") {
      const marketplaces = await base44.entities.Marketplace.filter({ ownerId: user.id });
      currentCount = marketplaces.length;
    } else if (resourceType === "listing") {
      const listings = await base44.entities.SaaSListing.filter({ ownerId: user.id });
      currentCount = listings.length;
    } else if (resourceType === "vendor") {
      const vendors = await base44.entities.Vendor.filter({ userId: user.id });
      currentCount = vendors.length;
    }

    const limit = resourceType === "marketplace" ? limits.marketplaceLimit : 
                  resourceType === "listing" ? limits.listingLimit : 
                  limits.vendorLimit;

    // 0 means unlimited
    const allowed = limit === 0 || currentCount < limit;

    return Response.json({ 
      allowed,
      currentCount,
      limit,
      plan: planKey,
      message: allowed ? "OK" : `Plan limit reached. Max: ${limit === 0 ? 'Unlimited' : limit}`
    });

  } catch (error) {
    console.error("validatePlanLimits error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});