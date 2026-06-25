import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store visitor places an order for single-purchase products in their cart.
// Validates the store-customer session, recomputes prices server-side from the
// real listings, then records a StoreOrder. PayPal capture is a later step —
// for now PayPal orders are marked pending and COD orders are placed directly.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, items, paymentMethod, phone, notes } = await req.json();

    if (!marketplaceId || !token || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = matches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Please sign in to checkout' }, { status: 401 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    if (!marketplace) {
      return Response.json({ error: 'Store not found' }, { status: 404 });
    }

    const payment = marketplace.payment || {};
    const method = paymentMethod === 'paypal' ? 'paypal' : 'cod';
    if (method === 'paypal' && !payment.paypalEnabled) {
      return Response.json({ error: 'PayPal is not enabled for this store' }, { status: 400 });
    }
    if (method === 'cod' && !payment.codEnabled) {
      return Response.json({ error: 'Manual payment is not enabled for this store' }, { status: 400 });
    }

    // Recompute every line item from the authoritative listing record.
    const lineItems = [];
    let total = 0;
    for (const it of items) {
      const ls = await base44.asServiceRole.entities.SaaSListing.filter({ id: it.listingId });
      const listing = ls[0];
      if (!listing) continue;
      const unitPrice = (listing.sharePrice || 0) * (listing.totalShares || 0);
      const quantity = Math.max(1, parseInt(it.quantity) || 1);
      lineItems.push({ listingId: listing.id, listingTitle: listing.softwareName || '', unitPrice, quantity });
      total += unitPrice * quantity;
    }

    if (lineItems.length === 0) {
      return Response.json({ error: 'No valid items to checkout' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.StoreOrder.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: customer.fullName || '',
      customerEmail: customer.email || '',
      phone: phone || customer.phone || '',
      items: lineItems,
      total,
      currency: marketplace.currency || 'USD',
      paymentMethod: method,
      paymentStatus: 'pending',
      status: 'placed',
      notes: notes || '',
    });

    return Response.json({
      success: true,
      order,
      // COD: instructions to display. PayPal: signal the frontend the next step is payment.
      codInstructions: method === 'cod' ? (payment.codInstructions || '') : '',
    });
  } catch (error) {
    console.error('storeCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});