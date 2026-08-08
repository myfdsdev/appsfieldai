import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendSubscriptionEmail, storeDashboardUrl } from '../../shared/storeSubscriptionMail.ts';

// Daily recurring-billing job for store subscription plans.
//
// Stripe-backed subscriptions (autoRenew): Stripe charges the customer itself, so we
// only sync the truth back — status + next renewal date pulled from the Stripe object.
//
// Everything else (PayPal / Razorpay / manual): when the paid period ends we raise a
// fresh StoreOrder for the next cycle and email the customer a renewal invoice. Paying
// that order flips the subscription back to active via the existing automation.

function addCycle(from: string, billingType?: string): string {
  const d = new Date(from);
  if (billingType === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();

    const subs = await svc.entities.StoreSubscription.list('-created_date', 500);
    const due = subs.filter((s) =>
      (s.status === 'active' || s.status === 'past_due') &&
      s.billingType !== 'one_time'
    );

    const marketplaceCache: Record<string, any> = {};
    const getMarketplace = async (id: string) => {
      if (!marketplaceCache[id]) {
        try { marketplaceCache[id] = (await svc.entities.Marketplace.filter({ id }))[0] || null; }
        catch (_) { marketplaceCache[id] = null; }
      }
      return marketplaceCache[id];
    };

    let synced = 0, invoiced = 0, lapsed = 0;

    for (const sub of due) {
      const marketplace = await getMarketplace(sub.marketplaceId);
      if (!marketplace) continue;

      // ── Stripe auto-billing: mirror Stripe's state ──
      if (sub.gatewaySubscriptionId && marketplace.payment?.stripeSecretKey) {
        try {
          const res = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.gatewaySubscriptionId}`, {
            headers: { Authorization: `Bearer ${marketplace.payment.stripeSecretKey}` },
          });
          const stripeSub = await res.json();
          if (!res.ok || !stripeSub?.status) continue;

          const statusMap: Record<string, string> = {
            active: 'active', trialing: 'active',
            past_due: 'past_due', unpaid: 'past_due', incomplete: 'past_due',
            canceled: 'cancelled', incomplete_expired: 'expired',
          };
          const mapped = statusMap[stripeSub.status] || sub.status;
          const periodEnd = stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : sub.currentPeriodEnd;

          if (mapped !== sub.status || periodEnd !== sub.currentPeriodEnd) {
            await svc.entities.StoreSubscription.update(sub.id, {
              status: mapped,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: !!stripeSub.cancel_at_period_end,
            });
            synced++;
          }
        } catch (_) { /* skip this one */ }
        continue;
      }

      // ── Manual cycles: only act once the paid period has actually ended ──
      if (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > now) continue;

      if (sub.cancelAtPeriodEnd) {
        await svc.entities.StoreSubscription.update(sub.id, { status: 'cancelled' });
        lapsed++;
        continue;
      }

      // Don't raise a second invoice within the same cycle.
      const noticedRecently = sub.lastRenewalNoticeAt &&
        new Date(sub.lastRenewalNoticeAt) > new Date(sub.currentPeriodEnd);
      if (noticedRecently) continue;

      const cycleLabel = sub.billingType === 'yearly' ? 'Yearly' : 'Monthly';
      const order = await svc.entities.StoreOrder.create({
        marketplaceId: sub.marketplaceId,
        storeCustomerId: sub.storeCustomerId,
        customerName: sub.customerName || '',
        customerEmail: sub.customerEmail || '',
        items: [{
          listingId: sub.planId,
          listingTitle: `${sub.planName} — ${cycleLabel} renewal`,
          unitPrice: Number(sub.price) || 0,
          quantity: 1,
        }],
        total: Number(sub.price) || 0,
        currency: sub.currency || marketplace.currency || 'USD',
        paymentMethod: sub.gateway && sub.gateway !== 'stripe' ? sub.gateway : 'cod',
        paymentStatus: 'pending',
        status: 'placed',
        accessStatus: 'locked',
        payoutEligible: false,
        notes: `Subscription renewal: ${sub.planName}`,
      });

      const updated = await svc.entities.StoreSubscription.update(sub.id, {
        status: 'past_due',
        orderId: order.id,
        // Give the customer the next cycle's window once they pay; until then the
        // renewal date reflects the cycle they now owe for.
        currentPeriodEnd: addCycle(sub.currentPeriodEnd, sub.billingType),
        lastRenewalNoticeAt: nowIso,
      });

      await sendSubscriptionEmail({
        svc,
        marketplace,
        templateKey: 'subscriptionRenewal',
        sub: updated,
      });
      invoiced++;
    }

    return Response.json({ success: true, checked: due.length, synced, invoiced, lapsed });
  } catch (error) {
    console.error('renewStoreSubscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}