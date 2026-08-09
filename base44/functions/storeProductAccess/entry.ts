import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// A subscribed store customer requests access to one of the products included
// with their plan. The store owner then grants it (with access link/instructions)
// from the store dashboard.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, token, listingId } = await req.json();

    if (!marketplaceId || !token || !listingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const customer = (await svc.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token }))[0];
    if (!customer) return Response.json({ error: 'Please sign in' }, { status: 401 });

    const subs = await svc.entities.StoreSubscription.filter({ marketplaceId, storeCustomerId: customer.id, status: 'active' });
    if (!subs.length) return Response.json({ error: 'You need an active plan to request access.' }, { status: 403 });
    const sub = subs[0];

    const listing = (await svc.entities.SaaSListing.filter({ id: listingId }))[0];
    if (!listing) return Response.json({ error: 'Product not found' }, { status: 404 });

    const existing = (await svc.entities.StoreProductAccess.filter({ marketplaceId, storeCustomerId: customer.id, listingId }))[0];
    if (existing) return Response.json({ success: true, access: existing });

    const access = await svc.entities.StoreProductAccess.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: customer.fullName || '',
      customerEmail: customer.email || '',
      listingId,
      listingTitle: listing.softwareName || '',
      subscriptionId: sub.id,
      planName: sub.planName || '',
      status: 'requested',
    });

    // Let the owner know a request is waiting (non-fatal).
    try {
      const mp = (await svc.entities.Marketplace.filter({ id: marketplaceId }))[0];
      let ownerEmail = mp?.supportEmail || '';
      if (!ownerEmail && mp?.ownerId) {
        ownerEmail = (await svc.entities.User.filter({ id: mp.ownerId }))[0]?.email || '';
      }
      if (ownerEmail) {
        await svc.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: `Access request: ${listing.softwareName}`,
          body: `${customer.fullName || customer.email} requested access to "${listing.softwareName}" on their ${sub.planName || 'subscription'} plan.\n\nGrant it from your store dashboard → Subscription Plans → Access Requests.`,
        });
      }
    } catch (_) { /* non-fatal */ }

    return Response.json({ success: true, access });
  } catch (error) {
    console.error('storeProductAccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}