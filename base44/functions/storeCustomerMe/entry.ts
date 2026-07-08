import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Verifies a store customer session token and returns the customer profile.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token } = await req.json();

    if (!marketplaceId || !token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = matches[0];

    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    return Response.json({
      customer: { id: customer.id, fullName: customer.fullName, email: customer.email, phone: customer.phone, avatarUrl: customer.avatarUrl || null, marketplaceId },
    });
  } catch (error) {
    console.error('storeCustomerMe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});