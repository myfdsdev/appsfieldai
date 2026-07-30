import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Creates a Razorpay Order using the STORE OWNER's own Razorpay Key ID + Secret
// (configured per-marketplace, like Stripe/PayPal) and returns the details the
// frontend needs to open the Razorpay Checkout popup. Called right after
// storeCheckout records a pending StoreOrder.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, orderId } = await req.json();

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
    if (!payment.razorpayEnabled || !payment.razorpayKeyId || !payment.razorpayKeySecret) {
      return Response.json({ error: 'Razorpay is not configured for this store' }, { status: 400 });
    }

    const currency = (order.currency || 'INR').toUpperCase();
    // Razorpay expects the amount in the smallest currency unit (paise for INR).
    const amount = Math.round(Number(order.total || 0) * 100);
    if (amount <= 0) {
      return Response.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    const auth = btoa(`${payment.razorpayKeyId}:${payment.razorpayKeySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: order.id,
        notes: { order_id: order.id, marketplace_id: marketplaceId },
      }),
    });
    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok || !rzpOrder.id) {
      console.error('Razorpay create order failed:', rzpOrder);
      return Response.json({ error: rzpOrder?.error?.description || 'Could not create the Razorpay order. Check the store Razorpay keys.' }, { status: 502 });
    }

    // Store the Razorpay order id for verify/idempotency.
    await base44.asServiceRole.entities.StoreOrder.update(order.id, { paymentReference: rzpOrder.id });

    return Response.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      keyId: payment.razorpayKeyId,
      amount,
      currency,
      storeName: marketplace?.name || 'Store',
      customerName: customer.fullName || '',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
    });
  } catch (error) {
    console.error('storeRazorpayCreateOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});