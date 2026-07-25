import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Passwordless "magic link" login for store customers.
//   step="request" → if an account exists for the email, generate a one-time
//                    login token (15-min expiry, stored in resetCode/resetExpires),
//                    email a login link, and always return generic success.
//   step="verify"  → validate the token, issue a fresh sessionToken, clear the
//                    one-time token, and return the customer + session.
//
// The store base URL is derived from the marketplace's custom domain / storeLink
// so the link lands the buyer straight on their dashboard, already signed in.

function makeToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { step, marketplaceId, email, loginToken, returnUrl } = await req.json();

    if (!marketplaceId) {
      return Response.json({ error: 'Missing marketplaceId' });
    }

    // ── Step 1: request a login link ──
    if (step === 'request') {
      if (!email) return Response.json({ error: 'Please enter your email.' });
      const cleanEmail = String(email).toLowerCase().trim();

      const mpList = await svc.entities.Marketplace.filter({ id: marketplaceId });
      const marketplace = mpList[0];
      if (!marketplace) return Response.json({ error: 'Store not found.' });

      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
      const customer = matches[0];

      // Only actually send when the account exists — but always report success
      // so we never reveal whether an email is registered.
      if (customer && customer.status !== 'suspended') {
        const token = makeToken();
        const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await svc.entities.StoreCustomer.update(customer.id, { resetCode: token, resetExpires: expires });

        // Build the store dashboard URL with the login token appended.
        const storeBase = marketplace.customDomain
          ? `https://${marketplace.customDomain}`
          : (marketplace.storeLink ? marketplace.storeLink.replace(/\/$/, '') : '');
        const base = storeBase || (returnUrl ? String(returnUrl).replace(/\/$/, '') : '');
        const loginUrl = base ? `${base}/dashboard?loginToken=${token}` : '';

        try {
          await svc.functions.invoke('sendStoreEmail', {
            marketplaceId,
            templateKey: 'magicLink',
            to: cleanEmail,
            vars: {
              customer_name: customer.fullName || 'there',
              login_url: loginUrl,
            },
          });
        } catch (e) { console.error('magic-link email failed:', e); }
      }
      return Response.json({ success: true });
    }

    // ── Step 2: verify the token and issue a session ──
    if (step === 'verify') {
      if (!loginToken) return Response.json({ error: 'Missing login token.' });
      const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, resetCode: String(loginToken).trim() });
      const customer = matches[0];
      if (!customer) return Response.json({ error: 'This login link is invalid or has already been used.' });
      if (customer.status === 'suspended') return Response.json({ error: 'This account has been suspended.' });
      if (!customer.resetExpires || new Date(customer.resetExpires).getTime() < Date.now()) {
        return Response.json({ error: 'This login link has expired. Please request a new one.' });
      }

      const sessionToken = makeToken();
      await svc.entities.StoreCustomer.update(customer.id, {
        sessionToken,
        resetCode: '',
        resetExpires: '',
      });

      return Response.json({
        token: sessionToken,
        customer: { id: customer.id, fullName: customer.fullName, email: customer.email, marketplaceId },
      });
    }

    return Response.json({ error: 'Invalid step' });
  } catch (error) {
    console.error('storeCustomerMagicLink error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});