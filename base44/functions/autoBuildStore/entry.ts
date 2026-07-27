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
    const isWorkspace = marketplace.type === 'workspace';

    // 1. Generate hero copy, FAQs, and testimonials with the built-in LLM.
    // Workspace stores sell SERVICES (agency/service offerings) instead of software
    // products, so the whole prompt — items, testimonials and agent training — is
    // reframed around services for that store type.
    const prompt = isWorkspace
      ? `You are writing marketing content for a SERVICE-OFFERING store (a "Workspace") called "${storeName}".
The owner describes the services they offer as: "${description || 'A studio offering professional services to clients.'}"
Service categories: ${categories.length ? categories.join(', ') : 'general professional services'}.

Generate compelling, professional, conversion-focused content for this service store's landing page:
- A short badge/pill text (max 6 words)
- A punchy hero headline (max 10 words)
- A pre-headline that sits above (max 8 words)
- A subheadline describing the value of the services (1-2 sentences)
- A call-to-action button label (2-3 words, e.g. "Book a Call", "Get Started")
- A short footer tagline describing the service store (max 12 words)
- Exactly 4 realistic SERVICE PACKAGES this store offers. Each must have: a service name (title), a short one-line description, a fuller 2-3 sentence description of what's included and the outcome, a category (use one of the store's categories when possible), a full price (number between 79 and 2000), and a discounted price (lower than the full price)
- Exactly 5 highly relevant FAQs about the services (question + helpful answer of 1-2 sentences)
- Exactly 5 realistic, niche-specific client testimonials (author name, author role/company, rating 4-5, content of 1-2 sentences about the service results)
- Sales agent training: a friendly human first name for the agent, a short professional tagline (max 4 words, e.g. "Client Success Lead"), the niche/audience this service store helps (short phrase), a reassuring guarantee line (short), a warm 1-2 sentence opening greeting the agent says to visitors (reference the store by name and that it offers services), and a detailed knowledge base (4-6 short paragraphs) the agent uses to sell the SERVICES — covering what services are offered, who they're for, the value/outcomes, how engagements/booking and delivery work, typical timelines, and how to handle common objections. Only use facts consistent with the description and categories.`
      : `You are writing marketing content for a SaaS deals marketplace called "${storeName}".
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
    // Coerce any value to a safe string — the AI sometimes returns null/undefined
    // for optional fields, which would fail the entity's string validation.
    const str = (v, fallback = '') => (typeof v === 'string' ? v : (v == null ? fallback : String(v)));
    const updatedPageSections = {
      ...existing,
      // Deal Maker sales agent — trained from the store description & catalog.
      dealMakerEnabled: true,
      dealMakerName: str(agent.name || existing.dealMakerName, 'Max'),
      dealMakerTagline: str(agent.tagline || existing.dealMakerTagline, 'AI Deal Strategist'),
      dealMakerImageUrl: str(existing.dealMakerImageUrl || DEFAULT_DEAL_MAKER_AVATAR),
      dealMakerNiche: str(agent.niche || existing.dealMakerNiche),
      dealMakerGuarantee: str(agent.guarantee || existing.dealMakerGuarantee),
      dealMakerGreeting: str(agent.greeting || existing.dealMakerGreeting),
      dealMakerKnowledge: str(agent.knowledge || existing.dealMakerKnowledge),
      headerEnabled: true,
      heroBadgeText: str(g.badge || existing.heroBadgeText),
      headerTitle: str(g.headline || existing.headerTitle || storeName),
      headerSubtitle: str(g.subheadline || existing.headerSubtitle),
      heroSideImageUrl: str(existing.heroSideImageUrl || DEFAULT_DEAL_MAKER_AVATAR),
      heroCtaText: str(g.ctaText || existing.heroCtaText, isWorkspace ? 'Get Started' : 'Browse Deals'),
      testimonialsEnabled: true,
      testimonialsTitle: str(existing.testimonialsTitle, 'What our customers say'),
      faqEnabled: true,
      faqTitle: str(existing.faqTitle, 'Frequently Asked Questions'),
      faqs: Array.isArray(g.faqs) ? g.faqs.filter(f => f.question && f.answer) : (existing.faqs || []),
      footerEnabled: true,
      footerText: str(g.footerTagline || existing.footerText, isWorkspace ? `${storeName} — professional services delivered with care.` : `${storeName} — your destination for the best SaaS deals.`),
      productsSectionTitle: str(existing.productsSectionTitle, isWorkspace ? 'Our Services' : ''),
    };

    // Don't let a pageSections validation error block product/testimonial creation.
    try {
      await base44.entities.Marketplace.update(marketplaceId, { pageSections: updatedPageSections });
    } catch (e) {
      console.error('pageSections update failed, continuing with product creation:', e.message);
    }

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
            prompt: isWorkspace
              ? `Clean modern service cover image for the service "${p.softwareName}" — ${p.shortDescription || p.category || 'professional service'}. Professional, polished, vibrant gradient background, service/agency vibe, no text.`
              : `Clean modern SaaS product cover image for "${p.softwareName}" — ${p.shortDescription || p.category || 'software tool'}. Sleek app dashboard UI, vibrant gradient background, professional, no text.`,
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
          category: p.category || (categories[0] || (isWorkspace ? 'Services' : 'SaaS')),
          pricingType: isWorkspace ? 'paid' : 'lifetime_deal',
          price: p.price || 199,
          discountPrice: p.discountPrice || Math.round((p.price || 199) * 0.6),
          dealType: 'single_purchase',
          isLifetimeDeal: !isWorkspace,
          noDayLimit: isWorkspace,
          dealDurationDays: isWorkspace ? undefined : 7,
          dealStartDate: new Date().toISOString(),
          dealEndDate: isWorkspace ? undefined : dealEnd,
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

    return Response.json({
      success: true,
      faqCount: updatedPageSections.faqs.length,
      testimonialCount,
      dummyCount,
      agentTrained: !!(agent.greeting || agent.knowledge),
    });
  } catch (error) {
    console.error('autoBuildStore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});