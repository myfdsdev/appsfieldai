import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner view: list real store customers for a marketplace, each with their
// reservations and amount-due summary. Only the marketplace owner (or admin) may call.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { marketplaceId } = await req.json();
    if (!marketplaceId) return Response.json({ error: 'Missing marketplaceId' }, { status: 400 });

    let market = null;
    try {
      const markets = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
      market = markets[0];
    } catch (_) { market = null; }
    if (!market) return Response.json({ error: 'Marketplace not found' }, { status: 404 });
    if (market.ownerId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [customers, reservations] = await Promise.all([
      base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId }, '-created_date'),
      base44.asServiceRole.entities.DealReservations.filter({ marketplaceId }, '-created_date'),
    ]);

    const byCustomer = {};
    reservations.forEach((r) => {
      const key = r.storeCustomerId || r.userEmail;
      if (!byCustomer[key]) byCustomer[key] = [];
      byCustomer[key].push(r);
    });

    const result = customers.map((c) => {
      const res = byCustomer[c.id] || [];
      const amountDue = res.filter(r => !r.paymentApproved && r.status !== 'cancelled' && r.status !== 'rejected')
        .reduce((s, r) => s + (r.amountDue || 0), 0);
      const amountPaid = res.filter(r => r.paymentApproved).reduce((s, r) => s + (r.amountDue || 0), 0);
      return {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        status: c.status,
        joinedAt: c.created_date,
        reservationCount: res.length,
        amountDue,
        amountPaid,
        reservations: res.map(r => ({
          id: r.id,
          listingTitle: r.listingTitle,
          spots: r.spots || 1,
          amountDue: r.amountDue || 0,
          paymentApproved: !!r.paymentApproved,
          status: r.status,
          createdAt: r.created_date,
        })),
      };
    });

    return Response.json({ customers: result });
  } catch (error) {
    console.error('getStoreCustomers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});