import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Passwordless "magic link" login for store customers.
//   step="request" → if an account exists for the email, generate a one-time
//                    login token (24-hour expiry, stored in resetCode/resetExpires)
//                    and email a login link to the store dashboard. If no account
//                    exists, returns an explicit "not registered" error.
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

      // The store owner asked for an explicit "not registered" message rather than
      // the generic privacy response, so tell the user plainly when no account exists.
      if (!customer) {
        return Response.json({ error: 'This email is not registered. Please create an account first.' });
      }
      if (customer.status === 'suspended') {
        return Response.json({ error: 'This account has been suspended.' });
      }

      // One-time login token, valid for 24 hours.
      const token = makeToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await svc.entities.StoreCustomer.update(customer.id, { resetCode: token, resetExpires: expires });

      // Build the correct store DASHBOARD URL with the login token appended so the
      // link authenticates and lands on the account/access dashboard — not the
      // public store home. returnUrl (the exact store base the user is on) wins;
      // otherwise fall back to custom domain / storeLink.
      const cleanReturn = returnUrl ? String(returnUrl).replace(/\/$/, '') : '';
      const storeBase = cleanReturn
        || (marketplace.customDomain ? `https://${marketplace.customDomain}`.replace(/\/$/, '') : '')
        || (marketplace.storeLink ? marketplace.storeLink.replace(/\/$/, '') : '');
      const loginUrl = storeBase ? `${storeBase}/dashboard?loginToken=${token}` : '';

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
      } catch (e) {
        console.error('magic-link email failed:', e);
        return Response.json({ error: 'We could not send the login email. Please try again.' });
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