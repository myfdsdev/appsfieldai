// Shared store-customer helpers used by the checkout and subscription flows.

export function makeToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Resolves the buying customer for a store transaction:
// 1) a valid session token identifies a logged-in customer,
// 2) otherwise guest flow — reuse the account matching the email, or silently create one.
// Returns { customer, createdNewAccount } or { error, status } for the caller to return.
export async function resolveStoreCustomer({ svc, marketplaceId, token, fullName, email, phone }) {
  let customer = null;
  let createdNewAccount = false;

  if (token) {
    const matches = await svc.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    customer = matches[0] || null;
    if (customer && customer.status === 'suspended') {
      return { error: 'Your account is suspended.', status: 401 };
    }
  }

  if (!customer) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    const guestName = String(fullName || '').trim();
    if (!cleanEmail || !guestName) {
      return { error: 'Please enter your name and email to continue.', status: 400 };
    }
    const existing = await svc.entities.StoreCustomer.filter({ marketplaceId, email: cleanEmail });
    if (existing.length) {
      customer = existing[0];
      if (customer.status === 'suspended') {
        return { error: 'Your account is suspended.', status: 401 };
      }
      if (!customer.sessionToken) {
        const sessionToken = makeToken();
        await svc.entities.StoreCustomer.update(customer.id, { sessionToken });
        customer.sessionToken = sessionToken;
      }
    } else {
      // Random password — the buyer sets their real one via the access email link.
      const salt = makeToken().slice(0, 24);
      const passwordHash = await hashPassword(makeToken().slice(0, 16), salt);
      const sessionToken = makeToken();
      customer = await svc.entities.StoreCustomer.create({
        marketplaceId,
        fullName: guestName,
        email: cleanEmail,
        passwordHash,
        passwordSalt: salt,
        phone: phone || '',
        status: 'active',
        sessionToken,
      });
      createdNewAccount = true;
    }
  }

  return { customer, createdNewAccount };
}