import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Reconciles the current user's JVZoo purchases into their plan fields.
//
// Why this exists: when a NEW customer buys via JVZoo, the IPN handler only
// *invites* them — no queryable User record exists yet, so the plan can't be
// assigned at purchase time. The purchase IS recorded on JvzooSale (with
// assignedPlanId). This function runs when the user is authenticated (e.g. right
// after they accept the invite and sign in) and applies every plan they bought,
// while removing any that were refunded/charged-back/cancelled.

const REMOVE_TXNS = ['RFND', 'CGBK', 'CANCEL-REBILL'];
const GRANT_TXNS = ['SALE', 'BILL', 'TEST'];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;
    if (!email) return Response.json({ ok: true, changed: false, reason: 'no email' });

    // All JVZoo transactions recorded for this email, oldest first so later
    // refunds/cancellations correctly override earlier grants.
    const sales = await base44.asServiceRole.entities.JvzooSale.filter(
      { ccustemail: email },
      'created_date',
      500
    );
    if (!sales.length) return Response.json({ ok: true, changed: false, reason: 'no sales' });

    // Build the set of plans this user should currently have.
    const planSet = new Set<string>(Array.isArray(user.jvzooPlanIds) ? user.jvzooPlanIds : []);
    for (const s of sales) {
      const planId = s.assignedPlanId;
      if (!planId) continue;
      if (GRANT_TXNS.includes(s.ctransaction)) planSet.add(planId);
      else if (REMOVE_TXNS.includes(s.ctransaction)) planSet.delete(planId);
    }

    const nextPlans = Array.from(planSet);
    const currentPlans = Array.isArray(user.jvzooPlanIds) ? user.jvzooPlanIds : [];

    // Decide the primary active plan. Keep the existing planId if it's still valid;
    // otherwise fall back to the first plan in the set.
    const nextPrimary = nextPlans.includes(user.planId) ? user.planId : (nextPlans[0] || '');

    const plansChanged =
      nextPlans.length !== currentPlans.length ||
      nextPlans.some((p) => !currentPlans.includes(p));
    const primaryChanged = nextPrimary !== (user.planId || '');

    if (!plansChanged && !primaryChanged) {
      return Response.json({ ok: true, changed: false });
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      jvzooPlanIds: nextPlans,
      planId: nextPrimary,
      billingStatus: nextPlans.length ? 'active' : (user.billingStatus || 'trial'),
      status: nextPlans.length ? 'active' : (user.status || 'active'),
    });

    return Response.json({ ok: true, changed: true, planId: nextPrimary, jvzooPlanIds: nextPlans });
  } catch (error) {
    console.error('syncJvzooPlans error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}