import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Updates a store customer's profile (name, phone, avatar) and optionally their
// password. Authenticated via the store session token. When changing the password
// the current password must be verified first.
async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, fullName, phone, avatarUrl, currentPassword, newPassword } = await req.json();

    if (!marketplaceId || !token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = matches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof fullName === 'string') updates.fullName = fullName.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl;

    // Password change — requires the correct current password.
    if (newPassword) {
      if (String(newPassword).length < 6) {
        return Response.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      }
      const currentHash = await hashPassword(currentPassword || '', customer.passwordSalt || '');
      if (currentHash !== customer.passwordHash) {
        return Response.json({ error: 'Your current password is incorrect.' }, { status: 401 });
      }
      const salt = crypto.randomUUID().replace(/-/g, '');
      updates.passwordSalt = salt;
      updates.passwordHash = await hashPassword(newPassword, salt);
    }

    await base44.asServiceRole.entities.StoreCustomer.update(customer.id, updates);

    return Response.json({
      customer: {
        id: customer.id,
        fullName: updates.fullName ?? customer.fullName,
        email: customer.email,
        phone: updates.phone ?? customer.phone,
        avatarUrl: updates.avatarUrl ?? customer.avatarUrl,
        marketplaceId,
      },
    });
  } catch (error) {
    console.error('storeCustomerUpdateProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});