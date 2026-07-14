import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-chat checkout for the Deal Maker agent.
// Silently creates (or reuses) a StoreCustomer account for the visitor from just
// their name + email, records a StoreOrder for the chosen product (full price OR
// per-spot share price), and returns the next step:
//   - paypal → an approval URL the chat opens in a new tab
//   - stripe → a Stripe Checkout session URL
//   - cod    → order placed, manual-payment instructions returned
// A "set your password & access your product" email is always sent so the buyer
// can claim the freshly-created account and find their purchase inside.

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function makeToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, listingId, priceMode, name, email, phone, paymentMethod, returnUrl } = await req.json();

    if (!marketplaceId || !listingId || !name || !email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mpList = await svc.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    if (!marketplace) return Response.json({ error: 'Store not found' }, { status: 404 });

    const ls = await svc.entities.SaaSListing.filter({ id: listingId });
    const listing = ls[0];
    if (!listing) return Response.json({ error: 'Product not found' }, { status: 404 });
    if (listing.salesPaused) {
      return Response.json({ error: `"${listing.softwareName}" isn't available right now.` }, { status: 409 });
    }

    const currency = marketplace.currency || 'USD';
    // Full price vs. share/spot price — the two ways to buy.
    const mode = priceMode === 'share' ? 'share' : 'full';
    // Full mode charges the ACTUAL selling price the buyer sees: the discounted
    // price when a valid discount is set (lower than list price), else the list
    // price. This keeps checkout in sync with the price shown on the card & chat.
    const hasValidDiscount = listing.discountPrice != null && Number(listing.discountPrice) > 0
      && (listing.price == null || Number(listing.discountPrice) < Number(listing.price));
    const fullSellingPrice = hasValidDiscount ? Number(listing.discountPrice) : Number(listing.price || 0);
    const unitPrice = mode === 'share'
      ? (listing.sharePrice || listing.discountPrice || listing.price || 0)
      : fullSellingPrice;
    const total = Number(unitPrice) || 0;
    if (total <= 0) {
      return Response.json({ error: 'This product has no purchasable price set.' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // ── Silent account creation / reuse ──
    // Reuse an existing store account for this email, else create one on the fly.
    let customer;
    const existing = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
    let createdNewAccount = false;
    if (existing.length) {
      customer = existing[0];
      // Ensure it has a live session token for later checkout steps.
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
        fullName: name,
        email: cleanEmail,
        passwordHash,
        passwordSalt: salt,
        phone: phone || '',
        status: 'active',
        sessionToken,
      });
      createdNewAccount = true;
    }

    // ── Record the order ──
    const method = paymentMethod === 'paypal' ? 'paypal' : (paymentMethod === 'stripe' ? 'stripe' : 'cod');
    const defaultDelivery = listing.delivery && (listing.delivery.accessUrl || listing.delivery.instructions)
      ? { accessUrl: listing.delivery.accessUrl || '', instructions: listing.delivery.instructions || '' }
      : undefined;

    const order = await svc.entities.StoreOrder.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: name,
      customerEmail: cleanEmail,
      phone: phone || customer.phone || '',
      items: [{ listingId: listing.id, listingTitle: listing.softwareName || '', unitPrice: total, quantity: 1 }],
      total,
      currency,
      paymentMethod: method,
      paymentStatus: 'pending',
      status: 'placed',
      accessStatus: 'locked',
      payoutEligible: false,
      vendorId: listing.vendorId || undefined,
      delivery: defaultDelivery,
      notes: `Purchased via Deal Maker chat (${mode} price)`,
    });

    // ── Access email: set your password & find your product inside ──
    const storeBase = marketplace.customDomain
      ? `https://${marketplace.customDomain}`
      : (marketplace.storeLink ? marketplace.storeLink.replace(/\/$/, '') : '');
    const accessUrl = storeBase ? `${storeBase}/dashboard` : returnUrl || '';
    try {
      await svc.functions.invoke('sendStoreEmail', {
        marketplaceId,
        templateKey: 'orderConfirmation',
        to: cleanEmail,
        order,
        dashboardUrl: accessUrl,
        vars: {
          customer_name: name,
          order_id: order.id,
          order_total: `${currency} ${total.toLocaleString()}`,
        },
      });
    } catch (_) { /* non-fatal */ }

    // ── Payment next step ──
    if (method === 'paypal') {
      const payment = marketplace.payment || {};
      if (!payment.paypalEnabled || !payment.paypalClientId || !payment.paypalSecret) {
        return Response.json({
          success: true, order, createdNewAccount,
          paymentPending: true,
          message: 'PayPal isn\'t set up on this store — your order is placed and the store will reach out with payment details.',
        });
      }
      const ppRes = await svc.functions.invoke('storePaypalCreateOrder', {
        marketplaceId,
        token: customer.sessionToken,
        orderId: order.id,
        returnUrl: accessUrl ? `${accessUrl}?paypal=${order.id}` : returnUrl,
        cancelUrl: accessUrl ? `${accessUrl}?paypal_cancel=1` : returnUrl,
      });
      if (ppRes?.data?.approveUrl) {
        return Response.json({ success: true, order, createdNewAccount, approveUrl: ppRes.data.approveUrl });
      }
      return Response.json({
        success: true, order, createdNewAccount, paymentPending: true,
        message: ppRes?.data?.error || 'Order placed — we couldn\'t open PayPal automatically.',
      });
    }

    if (method === 'stripe') {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        return Response.json({ success: true, order, createdNewAccount, paymentPending: true, message: 'Order placed — the store will send payment details.' });
      }
      const successUrl = accessUrl ? `${accessUrl}?order=${order.id}` : (returnUrl || '');
      const cancelUrl = accessUrl || returnUrl || '';
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: cleanEmail,
          'metadata[base44_app_id]': Deno.env.get('BASE44_APP_ID') || '',
          'metadata[storeOrderId]': order.id,
          'metadata[marketplaceId]': marketplaceId,
          'line_items[0][price_data][currency]': String(currency).toLowerCase(),
          'line_items[0][price_data][product_data][name]': listing.softwareName || 'Product',
          'line_items[0][price_data][unit_amount]': String(Math.round(total * 100)),
          'line_items[0][quantity]': '1',
        }),
      });
      const session = await stripeRes.json();
      if (session.error) {
        console.error('dealMakerCheckout stripe error:', session.error);
        return Response.json({ success: true, order, createdNewAccount, paymentPending: true, message: 'Order placed — the store will send payment details.' });
      }
      await svc.entities.StoreOrder.update(order.id, { paymentReference: session.id });
      return Response.json({ success: true, order, createdNewAccount, approveUrl: session.url });
    }

    // COD / manual
    return Response.json({
      success: true, order, createdNewAccount,
      codInstructions: marketplace.payment?.codInstructions || '',
      message: 'Order placed! Check your email to set your password and access your product.',
    });
  } catch (error) {
    console.error('dealMakerCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});