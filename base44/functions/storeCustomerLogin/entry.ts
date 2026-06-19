import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function makeToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, email, password } = await req.json();

    if (!marketplaceId || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
    const customer = matches[0];

    if (!customer) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    }
    if (customer.status === 'suspended') {
      return Response.json({ error: 'This account has been suspended.' }, { status: 403 });
    }

    const hash = await hashPassword(password, customer.passwordSalt || '');
    if (hash !== customer.passwordHash) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionToken = makeToken();
    await base44.asServiceRole.entities.StoreCustomer.update(customer.id, { sessionToken });

    return Response.json({
      token: sessionToken,
      customer: { id: customer.id, fullName: customer.fullName, email: customer.email, marketplaceId },
    });
  } catch (error) {
    console.error('storeCustomerLogin error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});