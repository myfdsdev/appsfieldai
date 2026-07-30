import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store visitor places an order for single-purchase products in their cart.
// Works BOTH for logged-in customers (via session token) AND for guests who
// simply provide a name + email — in the guest case a StoreCustomer account is
// silently created (or reused by email), exactly like the Deal Maker chat.
// Recomputes prices server-side from the real listings, then records a StoreOrder.

function makeToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}
async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, token, items, paymentMethod, fullName, email, phone, notes, refCode } = await req.json();

    if (!marketplaceId || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Resolve the customer ──
    // 1) A valid session token identifies a logged-in customer.
    // 2) Otherwise fall back to guest checkout: reuse or create an account from name + email.
    let customer = null;
    let createdNewAccount = false;
    if (token) {
      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
      customer = matches[0] || null;
      if (customer && customer.status === 'suspended') {
        return Response.json({ error: 'Your account is suspended.' }, { status: 401 });
      }
    }

    if (!customer) {
      const cleanEmail = String(email || '').toLowerCase().trim();
      const guestName = String(fullName || '').trim();
      if (!cleanEmail || !guestName) {
        return Response.json({ error: 'Please enter your name and email to checkout.' }, { status: 400 });
      }
      const existing = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
      if (existing.length) {
        customer = existing[0];
        if (customer.status === 'suspended') {
          return Response.json({ error: 'Your account is suspended.' }, { status: 401 });
        }
        if (!customer.sessionToken) {
          const sessionToken = makeToken();
          await svc.entities.StoreCustomer.update(customer.id, { sessionToken });
          customer.sessionToken = sessionToken;
        }
      } else {
        // Random password — the buyer sets their real one via the access email link.
        const salt = makeToken().slice(0, 24);
        const tempPassword = makeToken().slice(0, 16);
        const passwordHash = await hashPassword(tempPassword, salt);
        const sessionToken = makeToken();
        customer = await svc.entities.StoreCustomer.create({
          marketplaceId,
          fullName: guestName,
          email: cleanEmail,
          passwordHash,
          passwordSalt: salt,
          phone: phone || '',
          status: 'active',
          sessionToken,
        });
        createdNewAccount = true;
      }
    }

    if (!customer) {
      return Response.json({ error: 'Could not start checkout. Please enter your name and email.' }, { status: 400 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    if (!marketplace) {
      return Response.json({ error: 'Store not found' }, { status: 404 });
    }

    const payment = marketplace.payment || {};
    const method = ['paypal', 'stripe', 'razorpay', 'cod'].includes(paymentMethod) ? paymentMethod : 'cod';
    if (method === 'paypal' && !payment.paypalEnabled) {
      return Response.json({ error: 'PayPal is not enabled for this store' }, { status: 400 });
    }
    if (method === 'stripe' && !payment.stripeEnabled) {
      return Response.json({ error: 'Stripe is not enabled for this store' }, { status: 400 });
    }
    if (method === 'razorpay' && !payment.razorpayEnabled) {
      return Response.json({ error: 'Razorpay is not enabled for this store' }, { status: 400 });
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

    // Use the name supplied at checkout; fall back to the account's stored name.
    const buyerName = (fullName || '').trim() || customer.fullName || '';
    // Backfill the customer's account name if it was blank.
    if (buyerName && !customer.fullName) {
      try { await base44.asServiceRole.entities.StoreCustomer.update(customer.id, { fullName: buyerName }); } catch (_) { /* non-fatal */ }
    }

    const order = await base44.asServiceRole.entities.StoreOrder.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: buyerName,
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

      // Fire-and-forget "Cha-Ching" commission email to the affiliate for each earned commission.
      if (affiliate.email) {
        const affDashboardUrl = marketplace.customDomain
          ? `https://${marketplace.customDomain}/dashboard`
          : (marketplace.storeLink ? `${marketplace.storeLink.replace(/\/$/, '')}/dashboard` : undefined);
        for (const d of commissionDrafts) {
          try {
            await base44.asServiceRole.functions.invoke('sendStoreEmail', {
              marketplaceId,
              templateKey: 'commissionEarned',
              to: affiliate.email,
              dashboardUrl: affDashboardUrl,
              vars: {
                affiliate_name: affiliate.fullName || 'there',
                product_name: d.listingTitle,
                commission_amount: `${marketplace.currency || 'USD'} ${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                commission_rate: `${d.commissionRate}%`,
              },
            });
          } catch (_) { /* non-fatal */ }
        }
      }
    }

    // Fire-and-forget order confirmation email with a full branded invoice.
    if (customer.email) {
      try {
        const dashboardUrl = marketplace.customDomain
          ? `https://${marketplace.customDomain}/dashboard`
          : (marketplace.storeLink ? `${marketplace.storeLink.replace(/\/$/, '')}/dashboard` : undefined);
        await base44.asServiceRole.functions.invoke('sendStoreEmail', {
          marketplaceId,
          templateKey: 'orderConfirmation',
          to: customer.email,
          order,
          dashboardUrl,
          vars: {
            customer_name: buyerName || 'there',
            order_id: order.id,
            order_total: `${marketplace.currency || 'USD'} ${total.toLocaleString()}`,
          },
        });
      } catch (_) { /* non-fatal */ }
    }

    // Fire-and-forget Telegram alert to the store owner — new sale.
    try {
      const itemsSummary = lineItems.map((li) => `${li.quantity}× ${li.listingTitle}`).join(', ');
      await base44.asServiceRole.functions.invoke('notifyOwnerTelegram', {
        marketplaceId,
        text: `💰 <b>New sale on ${marketplace.name}!</b>\n\n` +
          `<b>Amount:</b> ${marketplace.currency || 'USD'} ${total.toLocaleString()}\n` +
          `<b>Customer:</b> ${buyerName || '—'} (${customer.email || '—'})\n` +
          `<b>Items:</b> ${itemsSummary}\n` +
          `<b>Payment:</b> ${method === 'paypal' ? 'PayPal' : method === 'stripe' ? 'Stripe (Card)' : method === 'razorpay' ? 'Razorpay' : 'Manual / COD'}`,
      });
    } catch (e) { console.error('storeCheckout telegram failed:', e); }

    return Response.json({
      success: true,
      order,
      createdNewAccount,
      // Session token so guest checkout can continue to the PayPal/Stripe step.
      token: customer.sessionToken || undefined,
      // COD: instructions to display. PayPal: signal the frontend the next step is payment.
      codInstructions: method === 'cod' ? (payment.codInstructions || '') : '',
    });
  } catch (error) {
    console.error('storeCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});