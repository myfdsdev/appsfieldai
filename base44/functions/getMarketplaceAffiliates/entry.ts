import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner (app user) fetches all affiliate applications + affiliates for a
// marketplace they own, enriched with per-affiliate commission summaries
// (payable / on-hold / paid) so the owner can manage manual payouts.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { marketplaceId } = await req.json();
    if (!marketplaceId) return Response.json({ error: 'Missing marketplaceId' }, { status: 400 });

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!marketplace || (marketplace.ownerId !== user.id && !isAdmin)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [applications, affiliates, commissions] = await Promise.all([
      base44.asServiceRole.entities.AffiliateApplication.filter({ marketplaceId }, '-created_date'),
      base44.asServiceRole.entities.Affiliate.filter({ marketplaceId }, '-created_date'),
      base44.asServiceRole.entities.AffiliateCommission.filter({ marketplaceId }),
    ]);

    // Summarize commissions per affiliate: payable (cleared, status='sale'),
    // hold (still in window), paid (already paid out), plus counts + refunds.
    const summaryByAff = {};
    for (const c of commissions) {
      const s = summaryByAff[c.affiliateId] || { payable: 0, hold: 0, paid: 0, refunded: 0, salesCount: 0, payableCount: 0 };
      const amt = c.amount || 0;
      if (c.status === 'sale') { s.payable += amt; s.payableCount += 1; s.salesCount += 1; }
      else if (c.status === 'hold') { s.hold += amt; s.salesCount += 1; }
      else if (c.status === 'paid') { s.paid += amt; s.salesCount += 1; }
      else if (c.status === 'refunded') { s.refunded += amt; }
      summaryByAff[c.affiliateId] = s;
    }

    const affiliatesEnriched = affiliates.map((a) => ({
      ...a,
      summary: summaryByAff[a.id] || { payable: 0, hold: 0, paid: 0, refunded: 0, salesCount: 0, payableCount: 0 },
    }));

    return Response.json({ applications, affiliates: affiliatesEnriched, holdDaysDefault: marketplace.affiliateSettings?.holdDays ?? 14 });
  } catch (error) {
    console.error('getMarketplaceAffiliates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});