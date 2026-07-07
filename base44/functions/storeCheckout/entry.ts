import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store visitor places an order for single-purchase products in their cart.
// Validates the store-customer session, recomputes prices server-side from the
// real listings, then records a StoreOrder. PayPal capture is a later step —
// for now PayPal orders are marked pending and COD orders are placed directly.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, items, paymentMethod, phone, notes, refCode } = await req.json();

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

    // Resolve the referring affiliate (if a valid ref code came in via the ?ref= link).
    let affiliate = null;
    if (refCode) {
      const affMatches = await base44.asServiceRole.entities.Affiliate.filter({ marketplaceId, refCode: String(refCode), status: 'active' });
      affiliate = affMatches[0] || null;
    }
    // Approved product IDs for this affiliate (commission only paid on approved products).
    let approvedByListing = {};
    if (affiliate) {
      const appList = await base44.asServiceRole.entities.AffiliateApplication.filter({ affiliateId: affiliate.id, status: 'approved' });
      appList.forEach((a) => { approvedByListing[a.listingId] = a; });
    }

    // Recompute every line item from the authoritative listing record.
    const lineItems = [];
    let total = 0;
    // Default delivery info from the products being purchased (single product = use its delivery).
    let defaultDelivery = null;
    let vendorId = '';
    // Commission entries to create after the order is recorded.
    const commissionDrafts = [];
    for (const it of items) {
      const ls = await base44.asServiceRole.entities.SaaSListing.filter({ id: it.listingId });
      const listing = ls[0];
      if (!listing) continue;
      // Block checkout for products the admin/owner has paused, or that aren't approved/live.
      if (listing.salesPaused) {
        return Response.json({ error: `"${listing.softwareName}" is not available for purchase right now.` }, { status: 409 });
      }
      // Prefer the authoritative `price` field the owner edits; fall back to
      // spots × per-spot price for older group deals that never set `price`.
      const unitPrice = (listing.price && listing.price > 0)
        ? listing.price
        : (listing.sharePrice || 0) * (listing.totalShares || 0);
      const quantity = Math.max(1, parseInt(it.quantity) || 1);
      const lineTotal = unitPrice * quantity;
      lineItems.push({ listingId: listing.id, listingTitle: listing.softwareName || '', unitPrice, quantity });
      total += lineTotal;
      if (!vendorId && listing.vendorId) vendorId = listing.vendorId;
      if (!defaultDelivery && listing.delivery && (listing.delivery.accessUrl || listing.delivery.instructions)) {
        defaultDelivery = { accessUrl: listing.delivery.accessUrl || '', instructions: listing.delivery.instructions || '' };
      }
      // Affiliate commission — only for affiliate-enabled products the affiliate is approved for.
      if (affiliate && listing.affiliateEnabled && approvedByListing[listing.id]) {
        const app = approvedByListing[listing.id];
        const rate = (app.commissionRate ?? listing.affiliateCommissionRate ?? 30);
        const amount = Math.round((lineTotal * rate / 100) * 100) / 100;
        if (amount > 0) {
          commissionDrafts.push({
            listingId: listing.id,
            listingTitle: listing.softwareName || '',
            orderTotal: lineTotal,
            commissionRate: rate,
            amount,
          });
        }
      }
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
      accessStatus: 'locked',
      payoutEligible: false,
      vendorId: vendorId || undefined,
      affiliateId: affiliate ? affiliate.id : undefined,
      affiliateRefCode: affiliate ? affiliate.refCode : undefined,
      delivery: defaultDelivery || undefined,
      notes: notes || '',
    });

    // Record affiliate commissions on hold (they clear once the refund window passes).
    if (affiliate && commissionDrafts.length) {
      let holdSum = 0;
      for (const d of commissionDrafts) {
        await base44.asServiceRole.entities.AffiliateCommission.create({
          marketplaceId,
          affiliateId: affiliate.id,
          refCode: affiliate.refCode,
          orderId: order.id,
          listingId: d.listingId,
          listingTitle: d.listingTitle,
          orderTotal: d.orderTotal,
          commissionRate: d.commissionRate,
          amount: d.amount,
          currency: marketplace.currency || 'USD',
          status: 'hold',
        });
        holdSum += d.amount;
      }
      try {
        await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
          totalPending: (affiliate.totalPending || 0) + holdSum,
        });
      } catch (_) { /* non-fatal */ }
    }

    // Fire-and-forget order confirmation email (respects the store's email settings/template).
    if (customer.email) {
      try {
        await base44.asServiceRole.functions.invoke('sendStoreEmail', {
          marketplaceId,
          templateKey: 'orderConfirmation',
          to: customer.email,
          vars: {
            customer_name: customer.fullName || 'there',
            order_id: order.id,
            order_total: `${marketplace.currency || 'USD'} ${total.toLocaleString()}`,
          },
        });
      } catch (_) { /* non-fatal */ }
    }

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