import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Store-scoped customer password reset (two steps):
//   step="request" → generate a 6-digit code, store it with a 15-min expiry, and
//                    email it to the customer via sendStoreEmail. Always returns
//                    a generic success so we never reveal whether an email exists.
//   step="confirm" → verify email + code (unexpired) and set the new password.

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function makeSalt() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { step, marketplaceId, email, code, newPassword } = await req.json();

    if (!marketplaceId || !email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const cleanEmail = String(email).toLowerCase().trim();

    // ── Step 1: request a reset code ──
    if (step === 'request') {
      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
      const customer = matches[0];
      // Only actually send when the account exists — but always report success.
      if (customer && customer.status !== 'suspended') {
        const resetCode = String(Math.floor(100000 + Math.random() * 900000));
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await svc.entities.StoreCustomer.update(customer.id, { resetCode, resetExpires });
        try {
          await svc.functions.invoke('sendStoreEmail', {
            marketplaceId,
            templateKey: 'passwordReset',
            to: cleanEmail,
            vars: {
              customer_name: customer.fullName || 'there',
              reset_code: resetCode,
            },
          });
        } catch (e) { console.error('reset email failed:', e); }
      }
      return Response.json({ success: true });
    }

    // ── Step 2: confirm the code and set the new password ──
    if (step === 'confirm') {
      if (!code || !newPassword) {
        return Response.json({ error: 'Enter the code and a new password.' }, { status: 400 });
      }
      if (String(newPassword).length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
      const customer = matches[0];
      if (!customer || !customer.resetCode || customer.resetCode !== String(code).trim()) {
        return Response.json({ error: 'Invalid or expired code.' }, { status: 400 });
      }
      if (!customer.resetExpires || new Date(customer.resetExpires).getTime() < Date.now()) {
        return Response.json({ error: 'This code has expired. Request a new one.' }, { status: 400 });
      }
      const salt = makeSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      await svc.entities.StoreCustomer.update(customer.id, {
        passwordHash,
        passwordSalt: salt,
        resetCode: '',
        resetExpires: '',
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('storeCustomerResetPassword error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});