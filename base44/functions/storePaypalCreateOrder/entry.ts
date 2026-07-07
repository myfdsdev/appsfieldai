import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Creates a PayPal order using the STORE OWNER's own PayPal REST credentials
// (configured per-marketplace) and returns the approval URL the buyer is sent to.
// Called right after storeCheckout records a pending StoreOrder for a PayPal order.
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
    if (!payment.paypalEnabled || !payment.paypalClientId || !payment.paypalSecret) {
      return Response.json({ error: 'PayPal is not configured for this store' }, { status: 400 });
    }

    const base = payment.paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get an access token from PayPal using the store's credentials.
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
      return Response.json({ error: 'Could not connect to PayPal. Check the store PayPal credentials.' }, { status: 502 });
    }

    const currency = order.currency || 'USD';
    const amount = Number(order.total || 0).toFixed(2);

    const createRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.id,
          amount: { currency_code: currency, value: amount },
          description: `Order ${order.id}`,
        }],
        application_context: {
          brand_name: marketplace?.name || 'Store',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });
    const createData = await createRes.json();
    if (!createData.id) {
      console.error('PayPal create order failed:', createData);
      return Response.json({ error: 'Could not create PayPal order' }, { status: 502 });
    }

    // Store the PayPal order id on our order for capture/idempotency.
    await base44.asServiceRole.entities.StoreOrder.update(order.id, { paymentReference: createData.id });

    const approve = (createData.links || []).find((l) => l.rel === 'approve');
    if (!approve?.href) {
      return Response.json({ error: 'PayPal did not return an approval link' }, { status: 502 });
    }

    return Response.json({ success: true, approveUrl: approve.href, paypalOrderId: createData.id });
  } catch (error) {
    console.error('storePaypalCreateOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});