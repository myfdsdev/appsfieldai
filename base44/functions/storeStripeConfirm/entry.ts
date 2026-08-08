import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Confirms a Stripe payment after the buyer returns to the store from Stripe Checkout.
// Retrieves the Checkout Session with the store's own Stripe key, verifies it's paid,
// then marks the StoreOrder paid. Called when Stripe redirects back with ?stripe=<orderId>.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, orderId } = await req.json();

    if (!marketplaceId || !token || !orderId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const custMatches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = custMatches[0];
    if (!customer) return Response.json({ error: 'Please sign in' }, { status: 401 });

    const orders = await base44.asServiceRole.entities.StoreOrder.filter({ id: orderId });
    const order = orders[0];
    if (!order || order.marketplaceId !== marketplaceId || order.storeCustomerId !== customer.id) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    // Idempotency — already captured.
    if (order.paymentStatus === 'paid') {
      return Response.json({ success: true, order });
    }
    if (!order.paymentReference) {
      return Response.json({ error: 'No Stripe session to confirm for this order' }, { status: 400 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const payment = marketplace?.payment || {};
    if (!payment.stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured for this store' }, { status: 400 });
    }

    // Retrieve the session and verify it's paid.
    const sRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.paymentReference}`, {
      headers: { Authorization: `Bearer ${payment.stripeSecretKey}` },
    });
    const session = await sRes.json();
    if (!sRes.ok) {
      console.error('Stripe retrieve session failed:', session);
      return Response.json({ error: 'Could not verify the payment with Stripe' }, { status: 502 });
    }
    // Recurring plan → remember the Stripe subscription so renewals bill automatically.
    if (session.subscription) {
      try {
        const linked = await base44.asServiceRole.entities.StoreSubscription.filter({ orderId: order.id });
        if (linked[0]) {
          await base44.asServiceRole.entities.StoreSubscription.update(linked[0].id, {
            gateway: 'stripe',
            gatewaySubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
            autoRenew: true,
          });
        }
      } catch (_) { /* non-fatal */ }
    }

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment was not completed', status: session.payment_status }, { status: 402 });
    }

    const updated = await base44.asServiceRole.entities.StoreOrder.update(order.id, {
      paymentStatus: 'paid',
      status: 'processing',
      paidAt: new Date().toISOString(),
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
    console.error('storeStripeConfirm error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});