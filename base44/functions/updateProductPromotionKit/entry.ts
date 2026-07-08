import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Store owner (app user) saves the promotion kit (marketing materials) for one of
// their products: banner images, videos, email swipes, and a rich LLM description
// affiliates can feed to an AI to write their own copy. Owner must own the store.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId, promotionKit } = await req.json();
    if (!listingId) return Response.json({ error: 'Missing listingId' }, { status: 400 });

    const ls = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    const listing = ls[0];
    if (!listing) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Ownership check — caller must own the marketplace (or be admin).
    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: listing.marketplaceId });
    const marketplace = mpList[0];
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!marketplace || (marketplace.ownerId !== user.id && !isAdmin && listing.ownerId !== user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const kit = promotionKit || {};
    const clean = {
      images: Array.isArray(kit.images) ? kit.images.filter(Boolean) : [],
      videos: Array.isArray(kit.videos) ? kit.videos.filter(Boolean) : [],
      emailSwipes: Array.isArray(kit.emailSwipes)
        ? kit.emailSwipes.filter((s) => s && (s.subject || s.body)).map((s) => ({ subject: s.subject || '', body: s.body || '' }))
        : [],
      llmDescription: typeof kit.llmDescription === 'string' ? kit.llmDescription : '',
    };

    const updated = await base44.asServiceRole.entities.SaaSListing.update(listing.id, { promotionKit: clean });

    return Response.json({ success: true, promotionKit: updated.promotionKit });
  } catch (error) {
    console.error('updateProductPromotionKit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});