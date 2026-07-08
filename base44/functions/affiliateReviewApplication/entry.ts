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

    return Response.json({ success: true, application: updated });
  } catch (error) {
    console.error('affiliateReviewApplication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});