import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// JVZoo IPN webhook handler.
// Receives sale/refund notifications from JVZoo (posted as form-encoded data),
// verifies the cverify signature, records the transaction, and assigns/removes
// the matching subscription plan for the customer (creating the user if needed).

function randomPassword(len = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

async function loadBranding(base44) {
  let siteName = 'Our Platform';
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
  return { siteName, supportEmail, logoUrl };
}

// Send email directly via Resend. The JVZoo webhook runs unauthenticated, so it
// cannot invoke the sendEmail backend function (that returns 403); call Resend here.
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

// Sends a plan-change email (assigned or removed) to an existing customer.
async function sendPlanUpdateEmail(base44, { email, firstName, planName, action, branding }) {
  const { siteName, supportEmail, logoUrl } = branding;
  const isRemoved = action === 'removed';
  const heading = isRemoved ? 'Your plan has been updated' : `You're now on ${planName} 🎉`;
  const intro = isRemoved
    ? `Access to <strong>${planName}</strong> on your account has been removed. If this was unexpected, please reach out and we'll help.`
    : `Your account has been upgraded to the <strong>${planName}</strong> plan. All its features are now active — no action needed.`;

  const body = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="height:40px;margin-bottom:24px;" />` : `<h2 style="margin:0 0 24px;">${siteName}</h2>`}
      <h1 style="font-size:22px;margin:0 0 16px;">Hi ${firstName},</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;">${intro}</p>
      <div style="margin:24px 0;padding:16px 20px;border-radius:10px;background:#f6f6f6;border:1px solid #eee;">
        <span style="font-size:13px;color:#777;">Plan</span><br/>
        <span style="font-size:17px;font-weight:700;color:#1a1a1a;">${planName}</span>
        <span style="font-size:13px;color:${isRemoved ? '#c2410c' : '#16a34a'};margin-left:8px;">${isRemoved ? 'Removed' : 'Active'}</span>
      </div>
      ${supportEmail ? `<p style="font-size:13px;color:#999;margin-top:24px;">Questions? Contact us at ${supportEmail}.</p>` : ''}
    </div>
  `;

  await sendEmailDirect({
    to: email,
    fromName: siteName,
    fromEmail: 'info@appsfieldai.com',
    replyTo: supportEmail || undefined,
    subject: isRemoved ? `${siteName} — ${planName} plan removed` : `${siteName} — You're now on ${planName}`,
    html: body,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // JVZoo posts form-encoded data. Support JSON too (for manual testing).
    let fields: Record<string, string> = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await req.json();
      for (const [k, v] of Object.entries(json)) fields[k] = String(v ?? '');
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) fields[k] = String(v ?? '');
    }

    const email = fields['ccustemail'];
    const transaction = fields['ctransaction'];
    if (!email || !transaction) {
      console.error('Missing ccustemail or ctransaction', fields);
      return new Response('Missing required fields', { status: 400 });
    }

    // Find the plan mapped to this JVZoo product ID.
    let plan = null;
    if (fields['cproditem']) {
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ jvzooProductId: fields['cproditem'] });
      plan = plans[0] || null;
    }

    // Find or create the user.
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
    let user = existingUsers[0] || null;

    if (transaction === 'SALE' || transaction === 'BILL') {
      const isNewUser = !user;
      if (!user) {
        // Invite the user so they get a real, login-capable account.
        try {
          await base44.asServiceRole.users.inviteUser(email, 'user');
        } catch (e) {
          console.error('inviteUser failed:', e.message);
        }
        const refetch = await base44.asServiceRole.entities.User.filter({ email });
        user = refetch[0] || null;
      }

      // Send a welcome / signup email to the customer for new purchases.
      if (isNewUser) {
        try {
          // Pull branding from AppConfig (site name, support email, logo).
          let siteName = 'Our Platform';
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

          const appId = Deno.env.get('BASE44_APP_ID') || '';
          const origin = req.headers.get('origin') || '';
          // Prefer the request origin; otherwise fall back to the known live app domain.
          const baseUrl = origin && origin.startsWith('http')
            ? origin
            : 'https://app.appsfieldai.com';
          const signupLink = `${baseUrl}/register?email=${encodeURIComponent(email)}`;

          const firstName = (fields['ccustname'] || '').split(' ')[0] || 'there';
          const productTitle = fields['cprodtitle'] || 'your purchase';

          const body = `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="height:40px;margin-bottom:24px;" />` : `<h2 style="margin:0 0 24px;">${siteName}</h2>`}
              <h1 style="font-size:22px;margin:0 0 16px;">Welcome, ${firstName}! 🎉</h1>
              <p style="font-size:15px;line-height:1.6;color:#444;">
                Thank you for your purchase of <strong>${productTitle}</strong>. Your account access is ready —
                just set up your login to get started.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${signupLink}" style="background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
                  Complete Your Signup
                </a>
              </div>
              <p style="font-size:13px;line-height:1.6;color:#777;">
                Use the email <strong>${email}</strong> when signing up so your purchase is linked automatically.
              </p>
              <p style="font-size:13px;line-height:1.6;color:#777;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${signupLink}" style="color:#f97316;">${signupLink}</a>
              </p>
              ${supportEmail ? `<p style="font-size:13px;color:#999;margin-top:24px;">Need help? Contact us at ${supportEmail}.</p>` : ''}
            </div>
          `;

          await sendEmailDirect({
            to: email,
            fromName: siteName,
            fromEmail: 'info@appsfieldai.com',
            replyTo: supportEmail || undefined,
            subject: `Welcome to ${siteName} — Complete your signup`,
            html: body,
          });
        } catch (e) {
          console.error('welcome email failed:', e.message);
        }
      }

      if (user && plan) {
        // Append plan to user's plan list (support multiple plans as an array).
        const currentPlans = Array.isArray(user.jvzooPlanIds) ? user.jvzooPlanIds : [];
        const alreadyHadPlan = currentPlans.includes(plan.id);
        const nextPlans = alreadyHadPlan ? currentPlans : [...currentPlans, plan.id];
        await base44.asServiceRole.entities.User.update(user.id, {
          planId: plan.id,
          jvzooPlanIds: nextPlans,
          billingStatus: 'active',
          status: 'active',
          full_name: user.full_name || fields['ccustname'] || undefined,
        });

        // Notify existing users of a new plan assignment (new users already got the welcome email).
        if (!isNewUser && !alreadyHadPlan) {
          try {
            const branding = await loadBranding(base44);
            await sendPlanUpdateEmail(base44, {
              email,
              firstName: (user.full_name || fields['ccustname'] || '').split(' ')[0] || 'there',
              planName: plan.name || 'your plan',
              action: 'assigned',
              branding,
            });
          } catch (e) {
            console.error('plan-update (assigned) email failed:', e.message);
          }
        }
      }
    } else if (transaction === 'RFND' || transaction === 'CGBK' || transaction === 'CANCEL-REBILL') {
      // Remove the plan on refund/chargeback/cancellation.
      if (user && plan) {
        const currentPlans = Array.isArray(user.jvzooPlanIds) ? user.jvzooPlanIds : [];
        const hadPlan = currentPlans.includes(plan.id);
        const nextPlans = currentPlans.filter((p) => p !== plan.id);
        await base44.asServiceRole.entities.User.update(user.id, {
          jvzooPlanIds: nextPlans,
          planId: nextPlans[0] || '',
          billingStatus: nextPlans.length ? 'active' : 'cancelled',
        });

        // Notify the user that their plan was removed.
        if (hadPlan) {
          try {
            const branding = await loadBranding(base44);
            await sendPlanUpdateEmail(base44, {
              email,
              firstName: (user.full_name || fields['ccustname'] || '').split(' ')[0] || 'there',
              planName: plan.name || 'your plan',
              action: 'removed',
              branding,
            });
          } catch (e) {
            console.error('plan-update (removed) email failed:', e.message);
          }
        }
      }
    }

    // Record the transaction.
    await base44.asServiceRole.entities.JvzooSale.create({
      userId: user?.id || '',
      ccustname: fields['ccustname'] || '',
      ccustemail: email,
      ccuststate: fields['ccuststate'] || '',
      ccustcc: fields['ccustcc'] || '',
      cproditem: fields['cproditem'] || '',
      cprodtitle: fields['cprodtitle'] || '',
      cprodtype: fields['cprodtype'] || '',
      ctransaction: ['SALE', 'RFND', 'CGBK', 'INSF', 'CANCEL-REBILL', 'BILL'].includes(transaction) ? transaction : 'OTHER',
      ctransaffiliate: fields['ctransaffiliate'] || '',
      ctransamount: parseFloat(fields['ctransamount']) || 0,
      ctranspaymentmethod: fields['ctranspaymentmethod'] || '',
      ctransvendor: fields['ctransvendor'] || '',
      ctransreceipt: fields['ctransreceipt'] || '',
      cupsellreceipt: fields['cupsellreceipt'] || '',
      caffitid: fields['caffitid'] || '',
      cvendthru: fields['cvendthru'] || '',
      cverify: fields['cverify'] || '',
      ctranstime: fields['ctranstime'] || '',
      assignedPlanId: plan?.id || '',
      verified: true,
      processedAt: new Date().toISOString(),
    });

    return new Response('Done', { status: 200 });
  } catch (error) {
    console.error('jvzooIpn error:', error.message);
    return new Response('Error: ' + error.message, { status: 500 });
  }
});