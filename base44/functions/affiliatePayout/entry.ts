import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner (app user) manually pays out an affiliate's CLEARED (status='sale')
// commissions. Since there's no wallet, payout is manual/wire — this records the
// payout: flips the selected (or all cleared) commissions to 'paid', moves the
// amount from the affiliate's earned balance to totalPaid, writes a ledger entry,
// and notifies the affiliate. Owner must own the marketplace (or be admin).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { affiliateId, commissionIds, payoutMethod, payoutReference } = await req.json();
    if (!affiliateId) return Response.json({ error: 'Missing affiliateId' }, { status: 400 });

    const affs = await base44.asServiceRole.entities.Affiliate.filter({ id: affiliateId });
    const affiliate = affs[0];
    if (!affiliate) return Response.json({ error: 'Affiliate not found' }, { status: 404 });

    // Ownership check.
    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: affiliate.marketplaceId });
    const marketplace = mpList[0];
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!marketplace || (marketplace.ownerId !== user.id && !isAdmin)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Payable commissions = cleared (status='sale'). Optionally limit to specific ids.
    const cleared = await base44.asServiceRole.entities.AffiliateCommission.filter({ affiliateId, status: 'sale' });
    const idSet = Array.isArray(commissionIds) && commissionIds.length ? new Set(commissionIds) : null;
    const toPay = idSet ? cleared.filter((c) => idSet.has(c.id)) : cleared;

    if (toPay.length === 0) {
      return Response.json({ error: 'No cleared commissions available to pay out' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let paidSum = 0;
    for (const c of toPay) {
      await base44.asServiceRole.entities.AffiliateCommission.update(c.id, {
        status: 'paid',
        paidAt: now,
        payoutMethod: payoutMethod || 'manual',
        payoutReference: payoutReference || '',
      });
      paidSum += c.amount || 0;
    }

    // Move the paid amount out of earned (payable) into totalPaid.
    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      totalEarned: Math.max(0, (affiliate.totalEarned || 0) - paidSum),
      totalPaid: (affiliate.totalPaid || 0) + paidSum,
    });

    // Audit trail.
    try {
      await base44.asServiceRole.entities.LedgerEntry.create({
        marketplaceId: affiliate.marketplaceId,
        action: 'commission',
        amount: -paidSum,
        currency: marketplace.currency || 'USD',
        actorId: user.id,
        actorName: user.full_name || 'Owner',
        reference: payoutReference || '',
        note: `Affiliate payout to ${affiliate.fullName || affiliate.email} (${toPay.length} commission${toPay.length > 1 ? 's' : ''}) via ${payoutMethod || 'manual'}`,
        metadata: { affiliateId: affiliate.id, count: toPay.length, payoutMethod: payoutMethod || 'manual' },
      });
    } catch (_) { /* non-fatal */ }

    // Notify the affiliate (in-app store-side note is optional; email is best-effort).
    if (affiliate.email) {
      try {
        const storeName = marketplace.name || 'Store';
        const brand = marketplace.branding?.primaryColor || '#f97316';
        const amountStr = `${marketplace.currency || 'USD'} ${paidSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;"><tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;font-size:18px;font-weight:700;color:#111;">${storeName}</td></tr>
              <tr><td style="padding:28px 32px;color:#222;font-size:14px;line-height:1.6;">
                <h1 style="margin:0 0 6px;font-size:20px;color:#111;">You've been paid! 💸</h1>
                <p style="margin:0 0 16px;color:#555;">${storeName} has sent you an affiliate commission payout.</p>
                <div style="padding:18px;background:#f0fbf5;border-radius:10px;text-align:center;">
                  <div style="font-size:12px;color:#1a8a4f;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Amount paid</div>
                  <div style="font-size:26px;color:#111;font-weight:800;margin-top:4px;">${amountStr}</div>
                  ${payoutMethod ? `<div style="font-size:12px;color:#888;margin-top:6px;">via ${payoutMethod}${payoutReference ? ` · ${payoutReference}` : ''}</div>` : ''}
                </div>
                <p style="margin:16px 0 0;color:#888;font-size:13px;">Keep sharing your referral links to earn more. — ${storeName}</p>
              </td></tr>
            </table>
          </td></tr></table></body></html>`;
        await base44.asServiceRole.functions.invoke('sendEmail', {
          to: affiliate.email,
          subject: `You've been paid ${amountStr} by ${storeName}`,
          html,
          fromName: storeName,
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, paidAmount: paidSum, count: toPay.length });
  } catch (error) {
    console.error('affiliatePayout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});