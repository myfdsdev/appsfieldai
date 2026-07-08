import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function makeRefCode(name, id) {
  const base = (name || 'aff').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'aff';
  return `${base}${id.slice(-5)}`;
}

// A store customer applies to become an affiliate for a specific product.
// Auto-creates their Affiliate record on first apply, then records the application with Q&A answers.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, token, listingId, answers } = await req.json();

    if (!marketplaceId || !token || !listingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const custMatches = await base44.asServiceRole.entities.StoreCustomer.filter({ marketplaceId, sessionToken: token });
    const customer = custMatches[0];
    if (!customer || customer.status === 'suspended') {
      return Response.json({ error: 'Please sign in to apply' }, { status: 401 });
    }

    const ls = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = ls[0];
    if (!listing || listing.marketplaceId !== marketplaceId) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!listing.affiliateEnabled) {
      return Response.json({ error: 'This product is not open for affiliates' }, { status: 400 });
    }

    // Ensure the Affiliate record exists.
    const existing = await base44.asServiceRole.entities.Affiliate.filter({ marketplaceId, storeCustomerId: customer.id });
    let affiliate = existing[0] || null;
    if (!affiliate) {
      affiliate = await base44.asServiceRole.entities.Affiliate.create({
        marketplaceId,
        storeCustomerId: customer.id,
        fullName: customer.fullName || '',
        email: customer.email || '',
        refCode: makeRefCode(customer.fullName, customer.id),
        status: 'active',
        totalEarned: 0,
        totalPending: 0,
      });
    }

    // One application per product per affiliate.
    const dup = await base44.asServiceRole.entities.AffiliateApplication.filter({ affiliateId: affiliate.id, listingId });
    if (dup.length) {
      return Response.json({ error: 'You have already applied to promote this product', application: dup[0] }, { status: 409 });
    }

    const application = await base44.asServiceRole.entities.AffiliateApplication.create({
      marketplaceId,
      affiliateId: affiliate.id,
      storeCustomerId: customer.id,
      affiliateName: customer.fullName || '',
      affiliateEmail: customer.email || '',
      listingId,
      listingTitle: listing.softwareName || '',
      answers: Array.isArray(answers) ? answers : [],
      status: 'pending',
      messages: [],
    });

    // Notify the store owner about the new application (in-app bell notification).
    try {
      await base44.asServiceRole.entities.Notification.create({
        userId: listing.ownerId || '',
        type: 'affiliate_application',
        title: 'New affiliate application',
        message: `${customer.fullName || customer.email} applied to promote "${listing.softwareName}".`,
        listingId,
      });
    } catch (_) { /* notification entity may differ — non-fatal */ }

    // Email the store owner so they can review & approve instantly.
    try {
      const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
      const marketplace = mpList[0];
      // Resolve owner email: owner's User account first, then the store's support email.
      let ownerEmail = marketplace?.supportEmail || '';
      if (marketplace?.ownerId) {
        try {
          const owners = await base44.asServiceRole.entities.User.filter({ id: marketplace.ownerId });
          if (owners[0]?.email) ownerEmail = owners[0].email;
        } catch (_) { /* fall back to support email */ }
      }

      if (ownerEmail) {
        const storeName = marketplace?.name || 'your store';
        const brand = marketplace?.branding?.primaryColor || '#f97316';
        const applicantName = customer.fullName || customer.email;
        const dashboardUrl = marketplace?.customDomain
          ? `https://${marketplace.customDomain}`
          : (marketplace?.storeLink || '');
        const answersHtml = (Array.isArray(answers) ? answers : [])
          .filter((a) => a?.answer)
          .map((a) => `<div style="margin-top:8px;"><div style="font-size:12px;color:#888;font-weight:600;">${String(a.question || '')}</div><div style="font-size:14px;color:#222;">${String(a.answer || '')}</div></div>`)
          .join('');

        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;"><tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;font-size:18px;font-weight:700;color:#111;">${storeName}</td></tr>
              <tr><td style="padding:28px 32px;color:#222;font-size:14px;line-height:1.6;">
                <h1 style="margin:0 0 6px;font-size:20px;color:#111;">New affiliate request 🎯</h1>
                <p style="margin:0 0 16px;color:#555;"><strong>${applicantName}</strong> has applied to become an affiliate for <strong>"${listing.softwareName}"</strong>.</p>
                <div style="padding:16px;background:#f7f7fb;border-radius:10px;">
                  <div style="font-size:13px;color:#888;">Applicant</div>
                  <div style="font-size:15px;color:#111;font-weight:600;">${applicantName}</div>
                  <div style="font-size:13px;color:#666;">${customer.email || ''}</div>
                  ${answersHtml}
                </div>
                ${dashboardUrl ? `<div style="margin:24px 0 4px;"><a href="${dashboardUrl}" style="display:inline-block;background:${brand};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:10px;">Review &amp; Approve</a></div>` : ''}
                <p style="margin:16px 0 0;color:#888;font-size:13px;">Approve or reject this request from your store dashboard's Affiliate Applications section.</p>
              </td></tr>
            </table>
          </td></tr></table></body></html>`;

        await base44.asServiceRole.functions.invoke('sendEmail', {
          to: ownerEmail,
          subject: `New affiliate request for "${listing.softwareName}"`,
          html,
          fromName: storeName,
          replyTo: customer.email || undefined,
        });
      }
    } catch (_) { /* email failure is non-fatal to the application */ }

    return Response.json({ success: true, application, affiliate });
  } catch (error) {
    console.error('affiliateApply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});