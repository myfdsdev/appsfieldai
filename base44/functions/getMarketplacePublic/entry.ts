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

    const [software, categories, reviews, customPages, testimonials] = await Promise.all([
      base44.asServiceRole.entities.SaaSListing.filter({ marketplaceId: m.id, status: 'active' }, '-created_date', 50),
      base44.asServiceRole.entities.SoftwareCategory.filter({ marketplaceId: m.id }),
      base44.asServiceRole.entities.Review.filter({ marketplaceId: m.id, status: 'approved' }, '-created_date', 20),
      base44.asServiceRole.entities.CustomPage.filter({ marketplaceId: m.id, isPublished: true }, 'sortOrder'),
      base44.asServiceRole.entities.Testimonial.filter({ marketplaceId: m.id, isPublished: true }, 'sortOrder'),
    ]);

    // Resolve seller display name for each listing:
    // - vendor-listed products show the vendor's business name
    // - everything else shows the store owner's name
    let storeOwnerName = '';
    try {
      if (m.ownerId) {
        const owner = await base44.asServiceRole.entities.User.filter({ id: m.ownerId });
        storeOwnerName = owner?.[0]?.full_name || '';
      }
    } catch { /* owner lookup failed — fall back below */ }

    const vendorIds = [...new Set(software.map((s) => s.vendorId).filter(Boolean))];
    const vendorNameById = {};
    if (vendorIds.length) {
      const vendors = await base44.asServiceRole.entities.Vendor.filter({ marketplaceId: m.id });
      vendors.forEach((v) => { vendorNameById[v.id] = v.vendorName; });
    }

    software.forEach((s) => {
      s.resolvedSellerName =
        (s.vendorId && vendorNameById[s.vendorId]) || storeOwnerName || s.sellerName || 'Store Owner';
    });

    // Expose only the voice PROVIDER (never the API key) so the Deal Maker widget
    // can pick instant browser speech for Base44 vs. the aiVoice call for OpenAI/Gemini.
    let voiceProvider = 'base44';
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      const eng = cfgs?.[0]?.aiEngine;
      // Voice uses its own provider, independent from the text provider
      // (fall back to the legacy shared provider for old configs).
      const vp = eng?.voiceProvider || eng?.provider;
      if (vp === 'openai' && eng?.openaiApiKey) voiceProvider = 'openai';
      else if (vp === 'gemini' && eng?.geminiApiKey) voiceProvider = 'gemini';
    } catch { /* default base44 */ }

    return Response.json({
      marketplace: {
        id: m.id,
        name: m.name,
        slug: m.slug,
        type: m.type,
        categories: m.categories || [],
        template: m.template,
        branding: m.branding,
        currency: m.currency,
        supportEmail: m.supportEmail,
        settings: m.settings,
        pageSections: m.pageSections,
        affiliateSettings: m.affiliateSettings || null,
        payment: m.payment || null,
        voiceProvider,
        dealMakerVoice: m.pageSections?.dealMakerVoice || 'river',
      },
      software,
      categories,
      reviews,
      customPages,
      testimonials,
      totalSoftware: software.length,
    });
  } catch (error) {
    console.error('getMarketplacePublic error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});