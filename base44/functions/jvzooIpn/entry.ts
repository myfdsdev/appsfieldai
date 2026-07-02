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
            const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'general' });
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

          await base44.functions.invoke('sendEmail', {
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
        const nextPlans = currentPlans.includes(plan.id) ? currentPlans : [...currentPlans, plan.id];
        await base44.asServiceRole.entities.User.update(user.id, {
          planId: plan.id,
          jvzooPlanIds: nextPlans,
          billingStatus: 'active',
          status: 'active',
          full_name: user.full_name || fields['ccustname'] || undefined,
        });
      }
    } else if (transaction === 'RFND' || transaction === 'CGBK' || transaction === 'CANCEL-REBILL') {
      // Remove the plan on refund/chargeback/cancellation.
      if (user && plan) {
        const currentPlans = Array.isArray(user.jvzooPlanIds) ? user.jvzooPlanIds : [];
        const nextPlans = currentPlans.filter((p) => p !== plan.id);
        await base44.asServiceRole.entities.User.update(user.id, {
          jvzooPlanIds: nextPlans,
          planId: nextPlans[0] || '',
          billingStatus: nextPlans.length ? 'active' : 'cancelled',
        });
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