import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Captures a PayPal payment after the buyer approves it, then marks the StoreOrder
// paid. Called when PayPal redirects the buyer back to the store with ?token=<paypalOrderId>.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, paypalOrderId } = await req.json();

    if (!marketplaceId || !token || !paypalOrderId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const custMatches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = custMatches[0];
    if (!customer) return Response.json({ error: 'Please sign in' }, { status: 401 });

    // Find our order by the PayPal order id we stored at create time.
    const orders = await base44.asServiceRole.entities.StoreOrder.filter({ marketplaceId, paymentReference: paypalOrderId });
    const order = orders[0];
    if (!order || order.storeCustomerId !== customer.id) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    // Idempotency — already captured.
    if (order.paymentStatus === 'paid') {
      return Response.json({ success: true, order });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const payment = marketplace?.payment || {};
    const base = payment.paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const authRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${payment.paypalClientId}:${payment.paypalSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const authData = await authRes.json();
    if (!authData.access_token) {
      console.error('PayPal auth failed:', authData);
      return Response.json({ error: 'Could not connect to PayPal' }, { status: 502 });
    }

    const capRes = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const capData = await capRes.json();
    if (capData.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', capData);
      return Response.json({ error: 'Payment was not completed', status: capData.status }, { status: 402 });
    }

    const updated = await base44.asServiceRole.entities.StoreOrder.update(order.id, {
      paymentStatus: 'paid',
      status: 'processing',
      paidAt: new Date().toISOString(),
    });

    return Response.json({ success: true, order: updated });
  } catch (error) {
    console.error('storePaypalCapture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});