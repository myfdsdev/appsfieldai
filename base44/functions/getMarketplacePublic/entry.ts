import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { slug, customDomain } = await req.json();

    let marketplace = [];

    // 1. Resolve by custom domain first (someone visiting deals.theirbrand.com / store.x.com).
    if (customDomain) {
      const clean = String(customDomain).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
      marketplace = await base44.asServiceRole.entities.Marketplace.filter({ customDomain: clean });
    }

    // 2. Else resolve by subdomain (the store-name slug), then fall back to slug.
    if (!marketplace.length && slug) {
      marketplace = await base44.asServiceRole.entities.Marketplace.filter({ subdomain: slug });
      if (!marketplace.length) {
        marketplace = await base44.asServiceRole.entities.Marketplace.filter({ slug });
      }
    }
    if (!marketplace.length) return Response.json({ error: 'Marketplace not found' }, { status: 404 });

    const m = marketplace[0];

    const [software, categories, reviews] = await Promise.all([
      base44.asServiceRole.entities.SaaSListing.filter({ marketplaceId: m.id, status: 'active' }, '-created_date', 50),
      base44.asServiceRole.entities.SoftwareCategory.filter({ marketplaceId: m.id }),
      base44.asServiceRole.entities.Review.filter({ marketplaceId: m.id, status: 'approved' }, '-created_date', 20),
    ]);

    return Response.json({
      marketplace: {
        id: m.id,
        name: m.name,
        slug: m.slug,
        type: m.type,
        template: m.template,
        branding: m.branding,
        currency: m.currency,
        supportEmail: m.supportEmail,
        settings: m.settings,
      },
      software,
      categories,
      reviews,
      totalSoftware: software.length,
    });
  } catch (error) {
    console.error('getMarketplacePublic error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});