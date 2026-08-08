import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Creates a Stripe Checkout Session using the STORE OWNER's own Stripe secret key
// (configured per-marketplace, like PayPal) and returns the hosted checkout URL the
// buyer is redirected to. Called right after storeCheckout records a pending StoreOrder.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, orderId, returnUrl, cancelUrl } = await req.json();

    if (!marketplaceId || !token || !orderId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the store-customer session owns this order.
    const custMatches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = custMatches[0];
    if (!customer) return Response.json({ error: 'Please sign in to pay' }, { status: 401 });

    const orders = await base44.asServiceRole.entities.StoreOrder.filter({ id: orderId });
    const order = orders[0];
    if (!order || order.marketplaceId !== marketplaceId || order.storeCustomerId !== customer.id) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.paymentStatus === 'paid') {
      return Response.json({ error: 'This order is already paid' }, { status: 409 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const payment = marketplace?.payment || {};
    if (!payment.stripeEnabled || !payment.stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured for this store' }, { status: 400 });
    }

    const currency = (order.currency || 'USD').toLowerCase();
    // Stripe expects the smallest currency unit (cents). Zero-decimal currencies aren't handled here.
    const unitAmount = Math.round(Number(order.total || 0) * 100);
    if (unitAmount <= 0) {
      return Response.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    // Build the Checkout Session request with the Stripe REST API (form-encoded).
    const productName = (order.items || []).map((i) => `${i.quantity}× ${i.listingTitle}`).join(', ')
      || `Order ${order.id}`;

    // If this order pays for a recurring StoreSubscription, use Stripe's native
    // subscription mode so Stripe auto-charges the customer every cycle.
    let recurringSub = null;
    try {
      const linked = await base44.asServiceRole.entities.StoreSubscription.filter({ orderId: order.id });
      const s = linked[0];
      if (s && (s.billingType === 'monthly' || s.billingType === 'yearly')) recurringSub = s;
    } catch (_) { /* non-fatal */ }

    const params = new URLSearchParams();
    params.set('mode', recurringSub ? 'subscription' : 'payment');
    if (recurringSub) {
      params.set('line_items[0][price_data][recurring][interval]', recurringSub.billingType === 'yearly' ? 'year' : 'month');
      params.set('subscription_data[metadata][subscription_id]', recurringSub.id);
      params.set('subscription_data[metadata][marketplace_id]', marketplaceId);
    }
    params.set('success_url', returnUrl);
    params.set('cancel_url', cancelUrl);
    if (customer.email) params.set('customer_email', customer.email);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', currency);
    params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
    params.set('line_items[0][price_data][product_data][name]', productName.slice(0, 250));
    // Track the order so the confirm step can find it, plus app id for Base44 tracking.
    params.set('metadata[order_id]', order.id);
    params.set('metadata[marketplace_id]', marketplaceId);
    const appId = Deno.env.get('BASE44_APP_ID');
    if (appId) params.set('metadata[base44_app_id]', appId);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payment.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session.id || !session.url) {
      console.error('Stripe create session failed:', session);
      return Response.json({ error: session?.error?.message || 'Could not create the Stripe checkout. Check the store Stripe key.' }, { status: 502 });
    }

    // Store the Stripe session id for capture/idempotency.
    await base44.asServiceRole.entities.StoreOrder.update(order.id, { paymentReference: session.id });

    return Response.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('storeStripeCreateCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});