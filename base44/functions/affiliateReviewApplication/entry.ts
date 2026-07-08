import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner (app user) reviews an affiliate application: approve/reject, set a custom
// commission rate, or post a reply message. Auth is the app user; must own the marketplace.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { applicationId, action, status, commissionRate, reviewNotes, text, holdDays } = await req.json();
    if (!applicationId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apps = await base44.asServiceRole.entities.AffiliateApplication.filter({ id: applicationId });
    const application = apps[0];
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    // Ownership check — the caller must own the marketplace (or be an admin).
    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: application.marketplaceId });
    const marketplace = mpList[0];
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!marketplace || (marketplace.ownerId !== user.id && !isAdmin)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {};

    if (action === 'decision') {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
      if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes || '';
      if (commissionRate !== undefined && commissionRate !== null && commissionRate !== '') {
        updates.commissionRate = Number(commissionRate);
      }
    } else if (action === 'commission') {
      updates.commissionRate = Number(commissionRate) || 0;
    } else if (action === 'holdDays') {
      // Set a performance-based hold-window override on the affiliate (not the application).
      const affs = await base44.asServiceRole.entities.Affiliate.filter({ id: application.affiliateId });
      const aff = affs[0];
      if (!aff) return Response.json({ error: 'Affiliate not found' }, { status: 404 });
      const val = (holdDays === '' || holdDays == null) ? null : Number(holdDays);
      await base44.asServiceRole.entities.Affiliate.update(aff.id, { holdDays: val });
      return Response.json({ success: true, affiliate: { id: aff.id, holdDays: val } });
    } else if (action === 'reply') {
      const messages = Array.isArray(application.messages) ? application.messages : [];
      messages.push({
        from: 'owner',
        authorName: marketplace.name || 'Store',
        text: (text || '').trim(),
        sentAt: new Date().toISOString(),
      });
      updates.messages = messages;
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.AffiliateApplication.update(application.id, updates);

    // On approve/reject, email the affiliate so they know the outcome.
    if (action === 'decision' && (status === 'approved' || status === 'rejected') && application.affiliateEmail) {
      try {
        const storeName = marketplace.name || 'Store';
        const brand = marketplace.branding?.primaryColor || '#f97316';
        const dashboardUrl = marketplace.customDomain
          ? `https://${marketplace.customDomain}/dashboard`
          : (marketplace.storeLink ? `${marketplace.storeLink.replace(/\/$/, '')}/dashboard` : '');
        const approved = status === 'approved';
        const rate = updates.commissionRate ?? application.commissionRate;
        const inner = approved
          ? `<h1 style="margin:0 0 6px;font-size:20px;color:#111;">You're approved! 🎉</h1>
             <p style="margin:0 0 16px;color:#555;">Great news — you've been approved to promote <strong>"${application.listingTitle}"</strong> at <strong>${storeName}</strong>${rate ? ` at a <strong>${rate}%</strong> commission` : ''}.</p>
             <p style="margin:0 0 16px;color:#555;">Head to your dashboard to grab your referral link and promotion kit, then start earning.</p>`
          : `<h1 style="margin:0 0 6px;font-size:20px;color:#111;">Application update</h1>
             <p style="margin:0 0 16px;color:#555;">Thanks for your interest in promoting <strong>"${application.listingTitle}"</strong> at <strong>${storeName}</strong>. Unfortunately your application wasn't approved at this time.</p>`;
        const notesBlock = updates.reviewNotes
          ? `<div style="margin:0 0 16px;padding:14px;background:#f7f7fb;border-radius:10px;"><div style="font-size:12px;color:#888;font-weight:600;margin-bottom:4px;">A note from ${storeName}</div><div style="font-size:14px;color:#333;white-space:pre-wrap;">${String(updates.reviewNotes)}</div></div>`
          : '';
        const btn = (approved && dashboardUrl)
          ? `<div style="margin:8px 0 4px;"><a href="${dashboardUrl}" style="display:inline-block;background:${brand};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:10px;">Open your affiliate dashboard</a></div>`
          : '';
        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;"><tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;font-size:18px;font-weight:700;color:#111;">${storeName}</td></tr>
              <tr><td style="padding:28px 32px;color:#222;font-size:14px;line-height:1.6;">${inner}${notesBlock}${btn}</td></tr>
            </table>
          </td></tr></table></body></html>`;
        await base44.asServiceRole.functions.invoke('sendEmail', {
          to: application.affiliateEmail,
          subject: approved ? `You're approved to promote "${application.listingTitle}"` : `Update on your affiliate application`,
          html,
          fromName: storeName,
        });
      } catch (_) { /* non-fatal */ }
    }

    return Response.json({ success: true, application: updated });
  } catch (error) {
    console.error('affiliateReviewApplication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});