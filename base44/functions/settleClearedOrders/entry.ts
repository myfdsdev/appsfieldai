import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled: marks paid, completed, non-refunded orders as payout-eligible once
// they've cleared the refund window (default 7 days since payment).
// Vendor payout balances only reflect cleared funds, so a seller can never
// request payout for orders that are still refundable or already refunded.
//
// Affiliate commissions clear hold → sale using the AFFILIATE'S own hold window:
//   affiliate.holdDays (performance override) → store affiliateSettings.holdDays → default.
// Trusted, low-refund affiliates can be given a shorter hold by the owner.
const REFUND_WINDOW_DAYS = 7;
const DEFAULT_AFFILIATE_HOLD_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const cutoff = Date.now() - REFUND_WINDOW_DAYS * 86400000;
    // Candidate orders: paid, delivered, not refunded, not yet marked eligible.
    const orders = await base44.asServiceRole.entities.StoreOrder.filter({
      paymentStatus: 'paid', status: 'completed', payoutEligible: false,
    });

    // Cache marketplaces so we can read each store's default affiliate hold days.
    const mpCache: Record<string, any> = {};
    const getMarketplace = async (id: string) => {
      if (!id) return null;
      if (mpCache[id] !== undefined) return mpCache[id];
      const mps = await base44.asServiceRole.entities.Marketplace.filter({ id });
      mpCache[id] = mps[0] || null;
      return mpCache[id];
    };

    let cleared = 0;
    let affiliateCommissionsCleared = 0;
    for (const o of orders) {
      const paidAtMs = o.paidAt ? new Date(o.paidAt).getTime() : new Date(o.created_date).getTime();
      if (paidAtMs > cutoff) continue; // still inside vendor refund window

      await base44.asServiceRole.entities.StoreOrder.update(o.id, { payoutEligible: true });

      // Credit the vendor's payout balance now that the funds have cleared.
      if (o.vendorId) {
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: o.vendorId });
        const vendor = vendors[0];
        if (vendor) {
          const mp = await getMarketplace(o.marketplaceId);
          const commissionRate = mp?.settings?.commissionRate || 0;
          const vendorEarning = (o.total || 0) * (1 - commissionRate / 100);
          await base44.asServiceRole.entities.Vendor.update(vendor.id, {
            payoutBalance: (vendor.payoutBalance || 0) + vendorEarning,
            totalSales: (vendor.totalSales || 0) + (o.total || 0),
          });
          await base44.asServiceRole.entities.LedgerEntry.create({
            marketplaceId: o.marketplaceId, action: 'vendor_credit', amount: vendorEarning,
            orderId: o.id, vendorId: vendor.id,
            note: `Funds cleared refund window — credited to vendor payout balance`,
          });
        }
      }
      cleared++;
    }

    // Clear affiliate commissions independently, using each affiliate's own hold window.
    // (Separate pass so a shorter affiliate hold clears even before the order is delivered/eligible.)
    const holds = await base44.asServiceRole.entities.AffiliateCommission.filter({ status: 'hold' });
    const affCache: Record<string, any> = {};
    for (const c of holds) {
      // Resolve the affiliate + their effective hold days.
      let aff = affCache[c.affiliateId];
      if (aff === undefined) {
        const affs = await base44.asServiceRole.entities.Affiliate.filter({ id: c.affiliateId });
        aff = affs[0] || null;
        affCache[c.affiliateId] = aff;
      }
      const mp = await getMarketplace(c.marketplaceId);
      const holdDays = (aff?.holdDays != null && aff.holdDays !== '')
        ? Number(aff.holdDays)
        : (mp?.affiliateSettings?.holdDays ?? DEFAULT_AFFILIATE_HOLD_DAYS);
      const affCutoff = Date.now() - (Number(holdDays) || 0) * 86400000;
      const startedMs = new Date(c.created_date).getTime();
      if (startedMs > affCutoff) continue; // still within this affiliate's hold window

      await base44.asServiceRole.entities.AffiliateCommission.update(c.id, {
        status: 'sale', clearedAt: new Date().toISOString(),
      });
      if (aff) {
        const amt = c.amount || 0;
        await base44.asServiceRole.entities.Affiliate.update(aff.id, {
          totalPending: Math.max(0, (aff.totalPending || 0) - amt),
          totalEarned: (aff.totalEarned || 0) + amt,
        });
        affCache[c.affiliateId] = { ...aff, totalPending: Math.max(0, (aff.totalPending || 0) - amt), totalEarned: (aff.totalEarned || 0) + amt };
      }
      affiliateCommissionsCleared++;
    }

    return Response.json({ success: true, cleared, affiliateCommissionsCleared });
  } catch (error) {
    console.error('settleClearedOrders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});