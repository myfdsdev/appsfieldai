import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendSubscriptionEmail } from '../../shared/storeSubscriptionMail.ts';

// Entity automation target: whenever a StoreOrder's payment status changes, keep the
// linked StoreSubscription in sync — paid → active (with the next renewal date),
// refunded → expired. This keeps every existing payment gateway flow untouched.

function addCycle(from, billingType) {
  const d = new Date(from);
  if (billingType === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const payload = await req.json();
    const order = payload.data || null;
    const orderId = payload.event?.entity_id;
    if (!orderId) return Response.json({ skipped: 'no order id' });

    let fullOrder = order;
    if (!fullOrder) {
      try { fullOrder = await svc.entities.StoreOrder.get(orderId); } catch (_) { fullOrder = null; }
    }
    if (!fullOrder) return Response.json({ skipped: 'order not found' });

    const subs = await svc.entities.StoreSubscription.filter({ orderId });
    if (!subs.length) return Response.json({ skipped: 'not a subscription order' });

    const sub = subs[0];
    const now = new Date().toISOString();

    if (fullOrder.paymentStatus === 'paid' && sub.status !== 'active') {
      const updated = await svc.entities.StoreSubscription.update(sub.id, {
        status: 'active',
        startedAt: sub.startedAt || now,
        currentPeriodEnd: sub.billingType === 'one_time' ? undefined : addCycle(now, sub.billingType),
      });

      // Confirmation email through the store's mailing system.
      let marketplace = null;
      try { marketplace = (await svc.entities.Marketplace.filter({ id: sub.marketplaceId }))[0] || null; } catch (_) {}
      let plan = null;
      try { plan = (await svc.entities.StorePlan.filter({ id: sub.planId }))[0] || null; } catch (_) {}
      await sendSubscriptionEmail({
        svc,
        marketplace,
        templateKey: 'subscriptionActive',
        sub: { ...updated, accessUrl: plan?.accessUrl, accessInstructions: plan?.accessInstructions },
      });

      return Response.json({ success: true, activated: sub.id });
    }

    if ((fullOrder.paymentStatus === 'refunded' || fullOrder.paymentStatus === 'failed') && sub.status === 'active') {
      await svc.entities.StoreSubscription.update(sub.id, { status: 'expired' });
      return Response.json({ success: true, expired: sub.id });
    }

    return Response.json({ success: true, unchanged: sub.id });
  } catch (error) {
    console.error('activateStoreSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}