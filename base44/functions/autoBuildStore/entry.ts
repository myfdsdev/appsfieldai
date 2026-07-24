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
- Exactly 4 realistic dummy SaaS products for this store. Each must have: a software name (title), a short one-line description, a fuller 2-3 sentence description, a category (use one of the store's categories when possible), a full price (number between 79 and 499), and a discounted deal price (lower than the full price)
- Exactly 5 highly relevant FAQs (question + helpful answer of 1-2 sentences)
- Exactly 5 realistic, niche-specific testimonials (author name, author role/company, rating 4-5, content of 1-2 sentences)
- Deal Maker sales agent training: a friendly human first name for the agent, a short professional tagline (max 4 words), the niche/audience this store helps (short phrase), a reassuring guarantee line (short), a warm 1-2 sentence opening greeting the agent says to visitors (reference the store by name), and a detailed knowledge base (4-6 short paragraphs) the agent uses to sell — covering what the store offers, who it's for, the value of the deals, how buying/delivery works, and how to handle common objections. Only use facts consistent with the description and categories.`;

    const genRes = await base44.functions.invoke('aiGenerate', {
      prompt,
      jsonSchema: {
        type: 'object',
        properties: {
          badge: { type: 'string' },
          preHeadline: { type: 'string' },
          headline: { type: 'string' },
          subheadline: { type: 'string' },
          ctaText: { type: 'string' },
          footerTagline: { type: 'string' },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                softwareName: { type: 'string' },
                shortDescription: { type: 'string' },
                fullDescription: { type: 'string' },
                category: { type: 'string' },
                price: { type: 'number' },
                discountPrice: { type: 'number' },
              },
            },
          },
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
          agent: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tagline: { type: 'string' },
              niche: { type: 'string' },
              guarantee: { type: 'string' },
              greeting: { type: 'string' },
              knowledge: { type: 'string' },
            },
          },
        },
      },
    });

    const g = genRes?.data?.result || {};

    // 2. Merge generated hero copy + FAQs + Deal Maker agent training into pageSections, keep existing settings.
    const existing = marketplace.pageSections || {};
    const fullHeadline = [g.preHeadline, g.headline].filter(Boolean).join(' — ') || g.headline || storeName;
    const agent = g.agent || {};
    // Default Deal Maker avatar — also used as the default hero side image.
    const DEFAULT_DEAL_MAKER_AVATAR = 'http://cdn.appsfieldai.com/uploads/6a2402b3a9b98ed1e7bf2a17/deal-maker-avatar_1784889432609.png';
    const updatedPageSections = {
      ...existing,
      // Deal Maker sales agent — trained from the store description & catalog.
      dealMakerEnabled: true,
      dealMakerName: agent.name || existing.dealMakerName || 'Max',
      dealMakerTagline: agent.tagline || existing.dealMakerTagline || 'AI Deal Strategist',
      dealMakerImageUrl: existing.dealMakerImageUrl || DEFAULT_DEAL_MAKER_AVATAR,
      dealMakerNiche: agent.niche || existing.dealMakerNiche || '',
      dealMakerGuarantee: agent.guarantee || existing.dealMakerGuarantee || '',
      dealMakerGreeting: agent.greeting || existing.dealMakerGreeting || '',
      dealMakerKnowledge: agent.knowledge || existing.dealMakerKnowledge || '',
      headerEnabled: true,
      heroBadgeText: g.badge || existing.heroBadgeText || '',
      headerTitle: g.headline || existing.headerTitle || storeName,
      headerSubtitle: g.subheadline || existing.headerSubtitle || '',
      heroSideImageUrl: existing.heroSideImageUrl || DEFAULT_DEAL_MAKER_AVATAR,
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

    // 4a. Create 4 AI-generated dummy products with cover images and a 7-day expiring deal.
    let dummyCount = 0;
    const GRADIENTS = [
      'linear-gradient(135deg,#f97316,#fbbf24)',
      'linear-gradient(135deg,#8b5cf6,#ec4899)',
      'linear-gradient(135deg,#06b6d4,#3b82f6)',
      'linear-gradient(135deg,#10b981,#84cc16)',
    ];
    if (Array.isArray(g.products) && g.products.length) {
      const dealEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const validProducts = g.products.filter(p => p.softwareName).slice(0, 4);
      const dummyRows = [];
      for (let i = 0; i < validProducts.length; i++) {
        const p = validProducts[i];
        let coverUrl = '';
        try {
          const img = await base44.integrations.Core.GenerateImage({
            prompt: `Clean modern SaaS product cover image for "${p.softwareName}" — ${p.shortDescription || p.category || 'software tool'}. Sleek app dashboard UI, vibrant gradient background, professional, no text.`,
          });
          coverUrl = img?.url || '';
        } catch (e) {
          console.error('GenerateImage failed for', p.softwareName, e.message);
        }
        dummyRows.push({
          marketplaceId,
          ownerId: marketplace.ownerId,
          softwareName: p.softwareName,
          logo: coverUrl,
          screenshots: coverUrl ? [coverUrl] : [],
          shortDescription: p.shortDescription || '',
          fullDescription: p.fullDescription || p.shortDescription || '',
          category: p.category || (categories[0] || 'SaaS'),
          pricingType: 'lifetime_deal',
          price: p.price || 199,
          discountPrice: p.discountPrice || Math.round((p.price || 199) * 0.6),
          dealType: 'single_purchase',
          isLifetimeDeal: true,
          noDayLimit: false,
          dealDurationDays: 7,
          dealStartDate: new Date().toISOString(),
          dealEndDate: dealEnd,
          dealStatus: 'live',
          rating: 5,
          imageGradient: GRADIENTS[i % GRADIENTS.length],
          status: 'active',
        });
      }
      if (dummyRows.length) {
        await base44.entities.SaaSListing.bulkCreate(dummyRows);
        dummyCount = dummyRows.length;
      }
    }

    // 4b. Import DFY products matching the store's categories. Skip categories with no matches.
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
      dummyCount,
      importedCount,
      agentTrained: !!(agent.greeting || agent.knowledge),
    });
  } catch (error) {
    console.error('autoBuildStore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});