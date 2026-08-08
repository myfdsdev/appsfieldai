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
      const updated = await svc.entities.StoreSubscription.update(subs[0].id, {
        status: 'cancelled',
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

    return Response.json({ plans, subscriptions });
  } catch (error) {
    console.error('storeSubscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}