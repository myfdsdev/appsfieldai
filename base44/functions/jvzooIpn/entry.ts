import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// JVZoo IPN webhook handler.
// Receives sale/refund notifications from JVZoo (posted as form-encoded data),
// verifies the cverify signature, records the transaction, and assigns/removes
// the matching subscription plan for the customer (creating the user if needed).

// Compute the JVZoo verification hash (SHA1, first 8 chars, uppercase).
async function computeVerify(fields: Record<string, string>, secretKey: string): Promise<string> {
  const keys = Object.keys(fields).filter((k) => k !== 'cverify').sort();
  let pop = '';
  for (const k of keys) {
    pop += (fields[k] ?? '') + '|';
  }
  pop += secretKey;
  const data = new TextEncoder().encode(pop);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 8).toUpperCase();
}

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

    // Verify signature against the secret stored in AppConfig (key = 'jvzoo').
    let verified = false;
    try {
      const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'jvzoo' });
      const secretKey = configs[0]?.jvzooSecretKey;
      if (secretKey) {
        const calced = await computeVerify(fields, secretKey);
        verified = calced === (fields['cverify'] || '').toUpperCase();
        if (!verified) console.warn('JVZoo signature mismatch', { calced, received: fields['cverify'] });
      } else {
        console.warn('No JVZoo secret key configured — skipping signature verification');
      }
    } catch (e) {
      console.error('Signature verification error:', e.message);
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
      verified,
      processedAt: new Date().toISOString(),
    });

    return new Response('Done', { status: 200 });
  } catch (error) {
    console.error('jvzooIpn error:', error.message);
    return new Response('Error: ' + error.message, { status: 500 });
  }
});