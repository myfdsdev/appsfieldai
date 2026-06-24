import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Auto-builds a newly-created marketplace's store content from the owner's
// description: AI-generated hero copy, FAQs and testimonials, plus product
// import from the DFY catalog matching the store's categories.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { marketplaceId } = await req.json();
    if (!marketplaceId) return Response.json({ error: 'marketplaceId is required' }, { status: 400 });

    const marketplace = await base44.entities.Marketplace.get(marketplaceId);
    if (!marketplace) return Response.json({ error: 'Marketplace not found' }, { status: 404 });

    const description = (marketplace.description || '').trim();
    const categories = marketplace.categories || [];
    const storeName = marketplace.name || 'this marketplace';

    // 1. Generate hero copy, FAQs, and testimonials with the built-in LLM.
    const prompt = `You are writing marketing content for a SaaS deals marketplace called "${storeName}".
The owner describes it as: "${description || 'A marketplace for discovering and buying lifetime SaaS deals.'}"
Product categories: ${categories.length ? categories.join(', ') : 'general SaaS tools'}.

Generate compelling, professional, conversion-focused content for this store's landing page:
- A short badge/pill text (max 6 words)
- A punchy hero headline (max 10 words)
- A pre-headline that sits above (max 8 words)
- A subheadline describing the value (1-2 sentences)
- A call-to-action button label (2-3 words)
- A short footer tagline describing the store (max 12 words)
- Exactly 5 highly relevant FAQs (question + helpful answer of 1-2 sentences)
- Exactly 5 realistic, niche-specific testimonials (author name, author role/company, rating 4-5, content of 1-2 sentences)`;

    const generated = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          badge: { type: 'string' },
          preHeadline: { type: 'string' },
          headline: { type: 'string' },
          subheadline: { type: 'string' },
          ctaText: { type: 'string' },
          footerTagline: { type: 'string' },
          faqs: {
            type: 'array',
            items: {
              type: 'object',
              properties: { question: { type: 'string' }, answer: { type: 'string' } },
            },
          },
          testimonials: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                authorName: { type: 'string' },
                authorRole: { type: 'string' },
                rating: { type: 'number' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const g = generated || {};

    // 2. Merge generated hero copy + FAQs into pageSections, keep existing settings.
    const existing = marketplace.pageSections || {};
    const fullHeadline = [g.preHeadline, g.headline].filter(Boolean).join(' — ') || g.headline || storeName;
    const updatedPageSections = {
      ...existing,
      headerEnabled: true,
      heroBadgeText: g.badge || existing.heroBadgeText || '',
      headerTitle: g.headline || existing.headerTitle || storeName,
      headerSubtitle: g.subheadline || existing.headerSubtitle || '',
      heroCtaText: g.ctaText || existing.heroCtaText || 'Browse Deals',
      testimonialsEnabled: true,
      testimonialsTitle: existing.testimonialsTitle || 'What our customers say',
      faqEnabled: true,
      faqTitle: existing.faqTitle || 'Frequently Asked Questions',
      faqs: Array.isArray(g.faqs) ? g.faqs.filter(f => f.question && f.answer) : (existing.faqs || []),
      footerEnabled: true,
      footerText: g.footerTagline || existing.footerText || `${storeName} — your destination for the best SaaS deals.`,
    };

    await base44.entities.Marketplace.update(marketplaceId, { pageSections: updatedPageSections });

    // 3. Create testimonial records for this marketplace.
    let testimonialCount = 0;
    if (Array.isArray(g.testimonials) && g.testimonials.length) {
      const rows = g.testimonials
        .filter(t => t.authorName && t.content)
        .map((t, i) => ({
          marketplaceId,
          authorName: t.authorName,
          authorRole: t.authorRole || '',
          rating: Math.min(5, Math.max(1, Math.round(t.rating || 5))),
          content: t.content,
          isPublished: true,
          sortOrder: i,
        }));
      if (rows.length) {
        await base44.entities.Testimonial.bulkCreate(rows);
        testimonialCount = rows.length;
      }
    }

    // 4. Import DFY products matching the store's categories. Skip categories with no matches.
    let importedCount = 0;
    if (categories.length) {
      const dfyProducts = await base44.asServiceRole.entities.DFYProduct.filter({ isActive: true });
      const wanted = categories.map(c => c.toLowerCase());
      const matches = dfyProducts.filter(p => p.category && wanted.includes(p.category.toLowerCase()));
      if (matches.length) {
        const listings = matches.map(p => ({
          marketplaceId,
          ownerId: marketplace.ownerId,
          softwareName: p.softwareName,
          logo: p.logo,
          shortDescription: p.shortDescription,
          fullDescription: p.fullDescription,
          category: p.category,
          features: p.features || [],
          pricingType: p.pricingType || 'lifetime_deal',
          price: p.price,
          discountPrice: p.discountPrice,
          dealType: p.dealType || 'single_purchase',
          sharePrice: p.sharePrice,
          totalShares: p.totalShares,
          monthlyRevenue: p.monthlyRevenue,
          growthRate: p.growthRate || 0,
          rating: p.rating || 5,
          tags: p.tags || [],
          imageGradient: p.imageGradient,
          status: 'active',
          dealStatus: 'live',
        }));
        await base44.entities.SaaSListing.bulkCreate(listings);
        importedCount = listings.length;
      }
    }

    return Response.json({
      success: true,
      faqCount: updatedPageSections.faqs.length,
      testimonialCount,
      importedCount,
    });
  } catch (error) {
    console.error('autoBuildStore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});