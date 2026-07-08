import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// The logged-in affiliate (store customer) saves their payout method + details
// (PayPal email, bank/wire info) so the owner knows where to send commissions.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, payoutMethod, payoutDetails } = await req.json();

    if (!marketplaceId || !token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const custMatches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = custMatches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const affMatches = await base44.asServiceRole.entities.Affiliate.filter({ marketplaceId, storeCustomerId: customer.id });
    const affiliate = affMatches[0];
    if (!affiliate) return Response.json({ error: 'You are not an affiliate yet' }, { status: 404 });

    const updated = await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      payoutMethod: payoutMethod || '',
      payoutDetails: payoutDetails || '',
    });

    return Response.json({ success: true, affiliate: { payoutMethod: updated.payoutMethod, payoutDetails: updated.payoutDetails } });
  } catch (error) {
    console.error('affiliateUpdatePayout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});