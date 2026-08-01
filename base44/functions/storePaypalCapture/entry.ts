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
        // Idempotency: a retried capture returns the SAME result instead of double-charging.
        'PayPal-Request-Id': `cap-${order.id}`,
      },
    });
    const capData = await capRes.json();

    // Pull the actual capture object from the response. A real, completed capture
    // has a capture id and status COMPLETED. Anything else means the money did NOT
    // land in the account (e.g. order still APPROVED, DECLINED, PENDING, or an error).
    const captureObj = capData?.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureObj?.id;
    const captureStatus = captureObj?.status;

    if (capData.status !== 'COMPLETED' || !captureId || captureStatus !== 'COMPLETED') {
      console.error('PayPal capture did not finalize:', JSON.stringify({
        httpStatus: capRes.status,
        orderStatus: capData?.status,
        captureId,
        captureStatus,
        name: capData?.name,
        details: capData?.details,
      }));
      // Never mark the order paid — the buyer was NOT charged (any hold auto-voids).
      await base44.asServiceRole.entities.StoreOrder.update(order.id, { paymentStatus: 'failed' });
      return Response.json({
        error: 'Your payment could not be completed and you were not charged. Please try again.',
        status: capData?.status || 'unknown',
      }, { status: 402 });
    }

    const updated = await base44.asServiceRole.entities.StoreOrder.update(order.id, {
      paymentStatus: 'paid',
      status: 'processing',
      paidAt: new Date().toISOString(),
      paypalCaptureId: captureId,
    });

    // Fire-and-forget order confirmation email with a full branded invoice.
    if (customer.email) {
      try {
        const dashboardUrl = marketplace?.customDomain
          ? `https://${marketplace.customDomain}/dashboard`
          : (marketplace?.storeLink ? `${marketplace.storeLink.replace(/\/$/, '')}/dashboard` : undefined);
        await base44.asServiceRole.functions.invoke('sendStoreEmail', {
          marketplaceId,
          templateKey: 'orderConfirmation',
          to: customer.email,
          order: updated,
          dashboardUrl,
          vars: {
            customer_name: customer.fullName || 'there',
            order_id: updated.id,
            order_total: `${marketplace?.currency || 'USD'} ${(updated.total || 0).toLocaleString()}`,
          },
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, order: updated });
  } catch (error) {
    console.error('storePaypalCapture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});