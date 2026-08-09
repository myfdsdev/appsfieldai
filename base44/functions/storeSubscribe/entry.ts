import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveStoreCustomer } from '../../shared/storeCustomers.ts';

// A store visitor subscribes to one of the store's own subscription plans.
// The charge itself reuses the store's existing payment rails: we record a normal
// StoreOrder for the first billing cycle, so PayPal / Stripe / Razorpay / manual
// checkout all work unchanged. The StoreSubscription starts as `pending` and is
// flipped to `active` once that order is marked paid.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, token, planId, paymentMethod, fullName, email, phone } = await req.json();

    if (!marketplaceId || !planId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let marketplace = null;
    try { marketplace = (await svc.entities.Marketplace.filter({ id: marketplaceId }))[0] || null; } catch (_) { marketplace = null; }
    if (!marketplace) return Response.json({ error: 'Store not found' }, { status: 404 });

    let plan = null;
    try { plan = (await svc.entities.StorePlan.filter({ id: planId, marketplaceId }))[0] || null; } catch (_) { plan = null; }
    if (!plan || plan.isActive === false) {
      return Response.json({ error: 'This plan is not available.' }, { status: 404 });
    }

    const payment = marketplace.payment || {};
    const method = ['paypal', 'stripe', 'razorpay', 'cod'].includes(paymentMethod) ? paymentMethod : 'cod';
    const enabledByMethod = {
      paypal: payment.paypalEnabled,
      stripe: payment.stripeEnabled,
      razorpay: payment.razorpayEnabled,
      cod: payment.codEnabled,
    };
    if (!enabledByMethod[method]) {
      return Response.json({ error: 'That payment method is not enabled for this store' }, { status: 400 });
    }

    // ── Resolve the subscriber (session token, else guest signup by name + email) ──
    const resolved = await resolveStoreCustomer({ svc, marketplaceId, token, fullName, email, phone });
    if (resolved.error) return Response.json({ error: resolved.error }, { status: resolved.status });
    const customer = resolved.customer;

    // Block a duplicate live subscription to the same plan.
    const mine = await svc.entities.StoreSubscription.filter({ marketplaceId, storeCustomerId: customer.id, planId });
    if (mine.some((s) => s.status === 'active')) {
      return Response.json({ error: 'You are already subscribed to this plan.' }, { status: 409 });
    }

    const buyerName = (fullName || '').trim() || customer.fullName || '';
    const currency = marketplace.currency || 'USD';
    const cycleLabel = plan.billingType === 'one_time' ? 'One-time' : plan.billingType === 'yearly' ? 'Yearly' : 'Monthly';
    const price = Number(plan.price) || 0;

    // Plan prices are already set by the owner in the store currency — no FX conversion.
    const order = await svc.entities.StoreOrder.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: buyerName,
      customerEmail: customer.email || '',
      phone: phone || customer.phone || '',
      items: [{ listingId: plan.id, listingTitle: `${plan.name} — ${cycleLabel} plan`, unitPrice: price, quantity: 1 }],
      total: price,
      currency,
      paymentMethod: method,
      paymentStatus: 'pending',
      status: 'placed',
      accessStatus: 'locked',
      payoutEligible: false,
      delivery: (plan.accessUrl || plan.accessInstructions)
        ? { accessUrl: plan.accessUrl || '', instructions: plan.accessInstructions || '' }
        : undefined,
      notes: `Subscription: ${plan.name}`,
    });

    const subscription = await svc.entities.StoreSubscription.create({
      marketplaceId,
      storeCustomerId: customer.id,
      customerName: buyerName,
      customerEmail: customer.email || '',
      planId: plan.id,
      planName: plan.name,
      billingType: plan.billingType || 'monthly',
      price,
      currency,
      productLimit: plan.productLimit ?? 0,
      orderId: order.id,
      status: 'pending',
      gateway: method,
      // Stripe bills recurring plans automatically; everything else is invoiced each cycle.
      autoRenew: false,
    });

    // ── Notify the subscriber and the store owner (non-fatal) ──
    const priceLabel = `${currency} ${price.toLocaleString()}`;
    const methodLabel = method === 'cod' ? 'Manual / bank transfer' : method;
    const baseVars = {
      customer_name: buyerName || 'there',
      customer_email: customer.email || '',
      customer_phone: phone || customer.phone || '',
      plan_name: plan.name,
      plan_price: priceLabel,
      billing_label: cycleLabel,
      payment_method: methodLabel,
    };
    const dashboardUrl = marketplace.customDomain
      ? `https://${marketplace.customDomain}/dashboard`
      : marketplace.storeLink ? `${String(marketplace.storeLink).replace(/\/$/, '')}/dashboard` : undefined;

    if (customer.email) {
      try {
        await svc.functions.invoke('sendStoreEmail', {
          marketplaceId, templateKey: 'subscriptionPlaced', to: customer.email, dashboardUrl, vars: baseVars,
        });
      } catch (_) { /* non-fatal */ }
    }
    try {
      let ownerEmail = marketplace.supportEmail || '';
      if (!ownerEmail && marketplace.ownerId) {
        const owner = (await svc.entities.User.filter({ id: marketplace.ownerId }))[0];
        ownerEmail = owner?.email || '';
      }
      if (ownerEmail) {
        await svc.functions.invoke('sendStoreEmail', {
          marketplaceId, templateKey: 'subscriptionOwner', to: ownerEmail, vars: baseVars,
        });
      }
    } catch (_) { /* non-fatal */ }

    return Response.json({
      success: true,
      order,
      subscription,
      token: customer.sessionToken || undefined,
      codInstructions: method === 'cod' ? (payment.codInstructions || '') : '',
    });
  } catch (error) {
    console.error('storeSubscribe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}