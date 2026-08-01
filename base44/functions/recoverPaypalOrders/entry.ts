import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Safety net: buyers sometimes approve a PayPal payment but never complete the
// redirect back to the store, so the capture never runs and the order is left
// pending while sitting in PayPal's "APPROVED" state. This runs on a schedule,
// finds those approved-but-uncaptured PayPal orders, captures them, and marks
// them paid — so nothing depends on the buyer completing the return trip.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const results: any[] = [];

  // Only look at recent, still-pending PayPal orders that have a PayPal order id.
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // last 3 days
  const pending = await base44.asServiceRole.entities.StoreOrder.filter({
    paymentMethod: 'paypal',
    paymentStatus: 'pending',
  }, '-created_date', 100);

  // Cache PayPal access tokens per marketplace so we don't re-auth for every order.
  const tokenCache: Record<string, { base: string; token: string } | null> = {};

  const getAuth = async (marketplaceId: string) => {
    if (marketplaceId in tokenCache) return tokenCache[marketplaceId];
    const mp = (await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId }))[0];
    const p = mp?.payment || {};
    if (!p.paypalClientId || !p.paypalSecret) { tokenCache[marketplaceId] = null; return null; }
    const base = p.paypalMode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const authRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${p.paypalClientId}:${p.paypalSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const authData = await authRes.json();
    const entry = authData.access_token ? { base, token: authData.access_token } : null;
    tokenCache[marketplaceId] = entry;
    return entry;
  };

  for (const order of pending) {
    if (!order.paymentReference) continue;
    if (order.created_date && order.created_date < cutoff) continue;

    const auth = await getAuth(order.marketplaceId);
    if (!auth) continue;

    try {
      // Check the order's real state on PayPal.
      const oRes = await fetch(`${auth.base}/v2/checkout/orders/${order.paymentReference}`, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      });
      const oData = await oRes.json();

      // Already captured on PayPal's side but our record missed it → mark paid.
      if (oData.status === 'COMPLETED') {
        const cap = oData?.purchase_units?.[0]?.payments?.captures?.[0];
        if (cap?.status === 'COMPLETED' && cap?.id) {
          await base44.asServiceRole.entities.StoreOrder.update(order.id, {
            paymentStatus: 'paid', status: 'processing',
            paidAt: new Date().toISOString(), paypalCaptureId: cap.id,
          });
          results.push({ id: order.id, action: 'marked_paid_already_completed' });
        }
        continue;
      }

      // Approved but not captured → capture it now.
      if (oData.status === 'APPROVED') {
        const capRes = await fetch(`${auth.base}/v2/checkout/orders/${order.paymentReference}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `cap-${order.id}`,
          },
        });
        const capData = await capRes.json();
        const captureObj = capData?.purchase_units?.[0]?.payments?.captures?.[0];
        const captureId = captureObj?.id;
        const captureStatus = captureObj?.status;

        if (capData.status === 'COMPLETED' && captureId && captureStatus === 'COMPLETED') {
          const updated = await base44.asServiceRole.entities.StoreOrder.update(order.id, {
            paymentStatus: 'paid', status: 'processing',
            paidAt: new Date().toISOString(), paypalCaptureId: captureId,
          });
          results.push({ id: order.id, action: 'captured' });

          // Send the same order-confirmation email the normal flow sends.
          try {
            const mp = (await base44.asServiceRole.entities.Marketplace.filter({ id: order.marketplaceId }))[0];
            if (order.customerEmail) {
              const dashboardUrl = mp?.customDomain
                ? `https://${mp.customDomain}/dashboard`
                : (mp?.storeLink ? `${mp.storeLink.replace(/\/$/, '')}/dashboard` : undefined);
              await base44.asServiceRole.functions.invoke('sendStoreEmail', {
                marketplaceId: order.marketplaceId,
                templateKey: 'orderConfirmation',
                to: order.customerEmail,
                order: updated,
                dashboardUrl,
                vars: {
                  customer_name: order.customerName || 'there',
                  order_id: updated.id,
                  order_total: `${mp?.currency || 'USD'} ${(updated.total || 0).toLocaleString()}`,
                },
              });
            }
          } catch (_) { /* non-fatal */ }
        } else {
          results.push({ id: order.id, action: 'capture_failed', orderStatus: capData?.status });
        }
      }
    } catch (e) {
      console.error('recoverPaypalOrders error for order', order.id, e);
      results.push({ id: order.id, action: 'error', message: e.message });
    }
  }

  return Response.json({ ok: true, checked: pending.length, results });
});