import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns a store customer's reserved products with live listing status and amount due.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token } = await req.json();

    if (!marketplaceId || !token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = matches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const reservations = await base44.asServiceRole.entities.DealReservations.filter(
      { marketplaceId, storeCustomerId: customer.id },
      '-created_date'
    );

    // Attach the current listing status/progress to each reservation.
    const products = await Promise.all(reservations.map(async (r) => {
      let listing = null;
      try {
        const found = await base44.asServiceRole.entities.SaaSListing.filter({ id: r.listingId });
        listing = found[0] || null;
      } catch (_) { /* listing may be deleted */ }
      const fulfilled = listing
        ? (listing.status === 'sold' || (listing.totalShares > 0 && listing.soldShares >= listing.totalShares))
        : false;
      // Once the reservation is fulfilled / payment approved, expose the product access info.
      const accessReady = r.status === 'fulfilled' || !!r.paymentApproved;
      const delivery = (accessReady && listing?.delivery && (listing.delivery.accessUrl || listing.delivery.instructions))
        ? { accessUrl: listing.delivery.accessUrl || '', instructions: listing.delivery.instructions || '' }
        : null;
      return {
        id: r.id,
        listingId: r.listingId,
        listingTitle: r.listingTitle,
        spots: r.spots || 1,
        amountDue: r.amountDue || 0,
        paymentApproved: !!r.paymentApproved,
        status: r.status,
        createdAt: r.created_date,
        delivery,
        listing: listing ? {
          imageGradient: listing.imageGradient,
          category: listing.category,
          soldShares: listing.soldShares || 0,
          totalShares: listing.totalShares || 0,
          sharePrice: listing.sharePrice || 0,
          status: listing.status,
          dealEndDate: listing.dealEndDate,
          noDayLimit: listing.noDayLimit,
        } : null,
        dealFulfilled: fulfilled,
      };
    }));

    return Response.json({ products });
  } catch (error) {
    console.error('storeCustomerProducts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});