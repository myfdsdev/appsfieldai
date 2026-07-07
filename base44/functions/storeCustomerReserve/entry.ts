import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// A logged-in store customer reserves spots on a listing in their store.
// Validates the store-customer session token, then records the reservation
// linked to that customer + marketplace, with the amount due computed.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, listingId, spots, phone, message } = await req.json();

    if (!marketplaceId || !token || !listingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = matches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Please sign in to reserve a spot' }, { status: 401 });
    }

    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = listings[0];
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const qty = Math.max(1, parseInt(spots) || 1);
    const perSpot = listing.dealType === 'single_purchase'
      ? (listing.sharePrice || 0) * (listing.totalShares || 0)
      : (listing.sharePrice || 0);
    const amountDue = perSpot * qty;

    const reservation = await base44.asServiceRole.entities.DealReservations.create({
      marketplaceId,
      storeCustomerId: customer.id,
      userName: customer.fullName || '',
      userEmail: customer.email || '',
      listingId,
      listingTitle: listing.softwareName || '',
      spots: qty,
      amountDue,
      paymentApproved: false,
      phone: phone || customer.phone || '',
      message: message || '',
      requestType: 'reserve_spot',
      status: 'pending',
    });

    try {
      await base44.functions.invoke('notifyAdminReservation', {
        userName: customer.fullName || customer.email,
        userEmail: customer.email,
        listingTitle: listing.softwareName,
        listingId,
        requestId: reservation.id,
        phone: phone || customer.phone || '',
        budget: amountDue,
        message: message || '',
      });
    } catch (_) { /* notification is best-effort */ }

    // Fire-and-forget reservation email to the customer (respects the store's email settings/template).
    if (customer.email) {
      try {
        await base44.asServiceRole.functions.invoke('sendStoreEmail', {
          marketplaceId,
          templateKey: 'reservation',
          to: customer.email,
          vars: {
            customer_name: customer.fullName || 'there',
            product_name: listing.softwareName || '',
          },
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, reservation });
  } catch (error) {
    console.error('storeCustomerReserve error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});