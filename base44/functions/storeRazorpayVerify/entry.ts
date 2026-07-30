import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Verifies a Razorpay payment after the buyer completes Checkout. Recomputes the
// HMAC-SHA256 signature with the store's own Key Secret over `<order_id>|<payment_id>`
// and compares it to the signature Razorpay returned. On match, marks the StoreOrder paid.
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    if (!marketplaceId || !token || !orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
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
    // The order this payment claims to cover must match the one we created.
    if (order.paymentReference && order.paymentReference !== razorpayOrderId) {
      return Response.json({ error: 'Payment does not match this order' }, { status: 400 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const payment = marketplace?.payment || {};
    if (!payment.razorpayKeySecret) {
      return Response.json({ error: 'Razorpay is not configured for this store' }, { status: 400 });
    }

    // Verify the signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret).
    const expected = await hmacSha256Hex(payment.razorpayKeySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
    if (expected !== razorpaySignature) {
      console.error('Razorpay signature mismatch for order', orderId);
      return Response.json({ error: 'Payment could not be verified' }, { status: 402 });
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
            order_total: `${marketplace?.currency || 'INR'} ${(updated.total || 0).toLocaleString()}`,
          },
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, order: updated });
  } catch (error) {
    console.error('storeRazorpayVerify error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});