import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner (app user) announces a product to their store's affiliates.
// Emails every active affiliate of the marketplace a "New product coming on {store}"
// message with the product name + description, plus an in-app notification.
// Owner must own the marketplace (or be an admin).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { marketplaceId, listingId, customMessage } = await req.json();
    if (!marketplaceId || !listingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!marketplace || (marketplace.ownerId !== user.id && !isAdmin)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ls = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = ls[0];
    if (!listing || listing.marketplaceId !== marketplaceId) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Recipients = all active affiliates of this store with an email.
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ marketplaceId, status: 'active' });
    const recipients = affiliates.filter((a) => a.email);
    if (recipients.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No affiliates to announce to yet.' });
    }

    const storeName = marketplace.name || 'Store';
    const brand = marketplace.branding?.primaryColor || '#f97316';
    const rate = listing.affiliateCommissionRate ?? marketplace.affiliateSettings?.defaultCommissionRate ?? 30;
    const description = listing.shortDescription || listing.fullDescription || '';
    const dashboardUrl = marketplace.customDomain
      ? `https://${marketplace.customDomain}/dashboard`
      : (marketplace.storeLink ? `${marketplace.storeLink.replace(/\/$/, '')}/dashboard` : '');
    const logoBlock = listing.logo
      ? `<img src="${listing.logo}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;display:block;margin:0 auto 12px;" />`
      : '';
    const customBlock = customMessage
      ? `<div style="margin:0 0 16px;padding:14px;background:#f7f7fb;border-radius:10px;font-size:14px;color:#333;white-space:pre-wrap;">${String(customMessage)}</div>`
      : '';

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;"><tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;font-size:18px;font-weight:700;color:#111;">${storeName}</td></tr>
          <tr><td style="padding:28px 32px;color:#222;font-size:14px;line-height:1.6;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:${brand};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">New product coming on ${storeName} 🚀</div>
            ${logoBlock}
            <h1 style="margin:0 0 6px;font-size:22px;color:#111;">${listing.softwareName || 'A new product'}</h1>
            ${description ? `<p style="margin:0 0 16px;color:#555;">${description}</p>` : ''}
            <div style="display:inline-block;margin:0 0 16px;padding:6px 14px;background:#e7f7ee;color:#1a8a4f;border-radius:20px;font-size:13px;font-weight:700;">Earn ${rate}% commission</div>
            ${customBlock}
            ${dashboardUrl ? `<div style="margin:8px 0 4px;"><a href="${dashboardUrl}" style="display:inline-block;background:${brand};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:10px;">Apply to promote it</a></div>` : ''}
          </td></tr>
        </table>
      </td></tr></table></body></html>`;

    let sent = 0;
    for (const aff of recipients) {
      try {
        await base44.asServiceRole.functions.invoke('sendEmail', {
          to: aff.email,
          subject: `New product coming on ${storeName}: ${listing.softwareName || 'New product'}`,
          html,
          fromName: storeName,
        });
        sent += 1;
      } catch (_) { /* skip failures, keep going */ }
      // In-app notification for the affiliate's linked store customer, best-effort.
      try {
        await base44.asServiceRole.entities.Notification.create({
          userId: aff.storeCustomerId || '',
          type: 'affiliate_message',
          title: `New product on ${storeName}`,
          message: `${listing.softwareName} is now available to promote. Earn ${rate}% commission.`,
          listingId,
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, sent, total: recipients.length });
  } catch (error) {
    console.error('announceProductToAffiliates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});