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

async function sendEmailDirect({ to, subject, html, fromName, fromEmail, replyTo }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const from = `${fromName || 'AppsField AI'} <${fromEmail || 'info@appsfieldai.com'}>`;
  const payload: Record<string, unknown> = { from, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || `Resend failed with status ${res.status}`);
  }
}

async function sendPlanAssignedEmail(base44, { email, firstName, plan, appUrl }) {
  let siteName = 'AppsField AI';
  let supportEmail = '';
  let logoUrl = '';
  try {
    const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
    const cfg = cfgs[0];
    if (cfg) {
      siteName = cfg.siteName || siteName;
      supportEmail = cfg.supportEmail || '';
      logoUrl = cfg.appLogoUrl || '';
    }
  } catch (_) { /* config optional */ }

  const planName = plan?.name || 'your plan';
  const ctaBlock = appUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}" style="background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
          Access Your App Here
        </a>
      </div>` : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="height:40px;margin-bottom:24px;" />` : `<h2 style="margin:0 0 24px;">${siteName}</h2>`}
      <h1 style="font-size:22px;margin:0 0 16px;">Hi ${firstName},</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;">
        Great news — your <strong>${planName}</strong> plan is now active on your account. All its features are unlocked and ready to use.
      </p>
      <div style="margin:24px 0;padding:16px 20px;border-radius:10px;background:#f6f6f6;border:1px solid #eee;">
        <span style="font-size:13px;color:#777;">Plan</span><br/>
        <span style="font-size:17px;font-weight:700;color:#1a1a1a;">${planName}</span>
        <span style="font-size:13px;color:#16a34a;margin-left:8px;">Active</span>
      </div>
      ${ctaBlock}
      ${supportEmail ? `<p style="font-size:13px;color:#999;margin-top:24px;">Questions? Contact us at ${supportEmail}.</p>` : ''}
    </div>
  `;

  await sendEmailDirect({
    to: email,
    fromName: siteName,
    fromEmail: 'info@appsfieldai.com',
    replyTo: supportEmail || undefined,
    subject: `${siteName} — You're now on ${planName}`,
    html,
  });
}

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

    // Send a "plan assigned" confirmation email for each newly-granted plan.
    const newlyGranted = nextPlans.filter((p) => !currentPlans.includes(p));
    if (newlyGranted.length) {
      const reqOrigin = req.headers.get('origin') || '';
      const appUrl = reqOrigin && reqOrigin.startsWith('http') ? reqOrigin : 'https://app.appsfieldai.com';
      const firstName = (user.full_name || '').split(' ')[0] || 'there';
      for (const planId of newlyGranted) {
        try {
          const plan = await base44.asServiceRole.entities.SubscriptionPlan.get(planId);
          await sendPlanAssignedEmail(base44, { email, firstName, plan, appUrl });
        } catch (e) {
          console.error('plan-assigned email failed:', e.message);
        }
      }
    }

    return Response.json({ ok: true, changed: true, planId: nextPrimary, jvzooPlanIds: nextPlans });
  } catch (error) {
    console.error('syncJvzooPlans error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}