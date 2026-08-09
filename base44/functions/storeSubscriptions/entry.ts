import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public plan list for a store + (when a session token is supplied) the signed-in
// customer's own subscriptions. Also handles cancelling a subscription.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, token, action, subscriptionId } = await req.json();
    if (!marketplaceId) return Response.json({ error: 'Missing marketplaceId' }, { status: 400 });

    let customer = null;
    if (token) {
      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
      customer = matches[0] || null;
    }

    if (action === 'cancel') {
      if (!customer) return Response.json({ error: 'Please sign in' }, { status: 401 });
      const subs = await svc.entities.StoreSubscription.filter({ id: subscriptionId, marketplaceId, storeCustomerId: customer.id });
      if (!subs.length) return Response.json({ error: 'Subscription not found' }, { status: 404 });
      const sub = subs[0];

      // Stop future automatic charges at Stripe (access stays until the period ends).
      if (sub.gatewaySubscriptionId) {
        try {
          const mp = (await svc.entities.Marketplace.filter({ id: marketplaceId }))[0];
          const key = mp?.payment?.stripeSecretKey;
          if (key) {
            await fetch(`https://api.stripe.com/v1/subscriptions/${sub.gatewaySubscriptionId}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'cancel_at_period_end=true',
            });
          }
        } catch (_) { /* non-fatal */ }
      }

      const stillPaid = sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > new Date();
      const updated = await svc.entities.StoreSubscription.update(sub.id, {
        status: stillPaid ? 'active' : 'cancelled',
        cancelAtPeriodEnd: true,
        autoRenew: false,
        cancelledAt: new Date().toISOString(),
      });
      return Response.json({ success: true, subscription: updated });
    }

    const allPlans = await svc.entities.StorePlan.filter({ marketplaceId });
    const plans = allPlans
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    let subscriptions = [];
    if (customer) {
      subscriptions = await svc.entities.StoreSubscription.filter({ marketplaceId, storeCustomerId: customer.id });
      subscriptions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    // Products unlocked by the customer's ACTIVE subscriptions — delivered with
    // their access info so the members area can hand them over.
    const unlockedProducts = [];
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    if (activeSubs.length) {
      const listings = await svc.entities.SaaSListing.filter({ marketplaceId });
      const accessRows = await svc.entities.StoreProductAccess.filter({ marketplaceId, storeCustomerId: customer.id });
      const seen = new Set();
      for (const sub of activeSubs) {
        const plan = allPlans.find((p) => p.id === sub.planId);
        if (!plan) continue;
        const ids = plan.includedListingIds || [];
        let items = ids.length ? listings.filter((l) => ids.includes(l.id)) : listings;
        const limit = plan.productLimit ?? 0;
        if (!ids.length) {
          if (limit === 0) items = [];
          else if (limit > 0) items = items.slice(0, limit);
        }
        for (const l of items) {
          if (seen.has(l.id)) continue;
          seen.add(l.id);
          const req = accessRows.find((a) => a.listingId === l.id) || null;
          unlockedProducts.push({
            accessStatus: req ? req.status : 'none',
            accessGrant: req && req.status === 'granted'
              ? { accessUrl: req.accessUrl || '', instructions: req.instructions || '' }
              : null,
            id: l.id,
            softwareName: l.softwareName,
            shortDescription: l.shortDescription || '',
            logo: l.logo || '',
            category: l.category || '',
            planName: plan.name,
            delivery: {
              accessUrl: l.delivery?.accessUrl || plan.accessUrl || '',
              instructions: l.delivery?.instructions || plan.accessInstructions || '',
            },
          });
        }
      }
    }

    return Response.json({ plans, subscriptions, unlockedProducts });
  } catch (error) {
    console.error('storeSubscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}