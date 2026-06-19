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
    const { marketplaceId, fullName, email, password, phone } = await req.json();

    if (!marketplaceId || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Ensure the marketplace exists
    const markets = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    if (!markets.length) {
      return Response.json({ error: 'Store not found' }, { status: 404 });
    }

    // Unique within this marketplace only — same email can exist on other stores.
    const existing = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
    if (existing.length) {
      return Response.json({ error: 'An account with this email already exists on this store.' }, { status: 409 });
    }

    const salt = makeToken().slice(0, 24);
    const passwordHash = await hashPassword(password, salt);
    const sessionToken = makeToken();

    const customer = await base44.asServiceRole.entities.StoreCustomer.create({
      marketplaceId,
      fullName: fullName || '',
      email: cleanEmail,
      passwordHash,
      passwordSalt: salt,
      phone: phone || '',
      status: 'active',
      sessionToken,
    });

    return Response.json({
      token: sessionToken,
      customer: { id: customer.id, fullName: customer.fullName, email: customer.email, marketplaceId },
    });
  } catch (error) {
    console.error('storeCustomerSignup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});