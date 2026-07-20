import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// SEO & Growth engine for a store:
//  - action "keywords": suggest high-opportunity, SEO keyword ideas for the store.
//  - action "blog": write a fully SEO-optimized, editable blog post (with meta
//    tags data + a generated cover image) targeting a keyword, weaving in what
//    the marketplace offers and its live lifetime deals.
const slugify = (s: string) =>
  String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

// Download a generated image and re-upload it to Cloudflare R2 so it's served
// from the store's own R2 domain instead of media.base44.com. Best-effort:
// falls back to the original URL if anything fails.
async function mirrorToR2(base44: any, srcUrl: string, slug: string): Promise<string> {
  try {
    const resp = await fetch(srcUrl);
    if (!resp.ok) return srcUrl;
    const contentType = resp.headers.get('content-type') || 'image/png';
    const buf = new Uint8Array(await resp.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const base64 = btoa(binary);
    const ext = (contentType.split('/')[1] || 'png').split(';')[0];
    const up = await base44.functions.invoke('uploadToR2', {
      fileData: base64,
      fileName: `blog-${slug || 'cover'}.${ext}`,
      contentType,
      campaignId: 'blog-cover',
    });
    return up?.data?.fileUrl || srcUrl;
  } catch (e) {
    console.error('mirrorToR2 failed:', (e as Error).message);
    return srcUrl;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, marketplaceId, keyword, idea } = body || {};
    if (!marketplaceId) return Response.json({ error: 'marketplaceId is required' }, { status: 400 });

    const marketplace = await base44.entities.Marketplace.get(marketplaceId);
    if (!marketplace) return Response.json({ error: 'Marketplace not found' }, { status: 404 });

    const storeName = marketplace.name || 'this marketplace';
    const description = (marketplace.description || '').trim();
    const categories = marketplace.categories || [];

    // Pull the store's live catalog so blogs can reference real products & deals.
    const listings = await base44.asServiceRole.entities.SaaSListing.filter(
      { marketplaceId, status: 'active' }, '-created_date', 30
    );
    const lifetimeDeals = listings
      .filter((l: any) => l.isLifetimeDeal || l.pricingType === 'lifetime_deal')
      .slice(0, 8)
      .map((l: any) => ({
        name: l.softwareName,
        category: l.category || 'General',
        short: l.shortDescription || '',
        price: l.price ?? null,
        deal_price: l.discountPrice ?? null,
      }));
    const catalog = listings.slice(0, 15).map((l: any) => ({
      name: l.softwareName,
      category: l.category || 'General',
      short: l.shortDescription || '',
    }));

    const storeContext = `STORE: "${storeName}".
DESCRIPTION: ${description || 'A marketplace for discovering and buying lifetime SaaS deals.'}
CATEGORIES: ${categories.length ? categories.join(', ') : 'general SaaS tools'}.
PRODUCTS ON THE STORE (sample): ${JSON.stringify(catalog)}.
LIVE LIFETIME DEALS: ${JSON.stringify(lifetimeDeals)}.`;

    // ── KEYWORDS: generate SEO keyword ideas ────────────────────────────────
    if (action === 'keywords') {
      const prompt = `You are a senior SEO specialist. Based on this store, suggest 12 high-opportunity, buyer-intent keywords/topics that can realistically rank on Google and bring ORGANIC traffic to this marketplace. Favor long-tail, "best/top tools for X" and "how to" style phrases relevant to the store's niche and categories. Avoid overly broad, impossibly-competitive single words.

${storeContext}

For each keyword return: the keyword phrase, a one-line reason it's a good organic opportunity, and an intent label (informational, commercial, or transactional).`;

      const genRes = await base44.functions.invoke('aiGenerate', {
        prompt,
        jsonSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  reason: { type: 'string' },
                  intent: { type: 'string' },
                },
              },
            },
          },
        },
      });
      const kws = genRes?.data?.result?.keywords || [];
      return Response.json({ keywords: Array.isArray(kws) ? kws : [] });
    }

    // ── BLOG: write a full SEO-optimized post ───────────────────────────────
    if (action === 'blog') {
      const topic = (keyword || idea || '').trim();
      if (!topic) return Response.json({ error: 'A keyword or idea is required' }, { status: 400 });

      const focusInstruction = keyword
        ? `The FOCUS KEYWORD to rank for is: "${keyword}". Use it naturally in the title, first paragraph, at least one H2, and the meta description.`
        : `The owner described what they want the post to be about: "${idea}". Derive a strong focus keyword from this and rank for it.`;

      const prompt = `You are a senior SEO content specialist writing a blog post for the marketplace "${storeName}" to bring ORGANIC Google traffic.

${storeContext}

${focusInstruction}

Write ONE complete, genuinely useful, well-structured blog article (900-1300 words) in MARKDOWN. Requirements:
- Compelling H1 title (keyword-optimized, not clickbait).
- Open with a hook that includes the focus keyword in the first 100 words.
- Use clear H2/H3 subheadings, short paragraphs, and at least one bulleted or numbered list (e.g. "Top tools for ...").
- The article MUST naturally introduce ${storeName}: what it is, what visitors can find there, and which product categories it covers.
- Include a section that highlights the store's LIVE LIFETIME DEALS by name (only real ones from the data above) and why they're worth grabbing. If there are no lifetime deals, mention deals are added regularly.
- Sound like a real expert, be factual, do NOT invent products, prices, or fake statistics.
- End with a short call-to-action inviting the reader to browse ${storeName}.

Also produce SEO metadata: an SEO meta title (<= 60 chars), a meta description (<= 155 chars, includes the focus keyword), a URL slug, a 1-2 sentence excerpt, and 5-8 secondary keywords/tags. Also write a short vivid prompt for a blog cover image (no text in the image).`;

      const genRes = await base44.functions.invoke('aiGenerate', {
        prompt,
        jsonSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            slug: { type: 'string' },
            focusKeyword: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            excerpt: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            content: { type: 'string' },
            coverImagePrompt: { type: 'string' },
          },
        },
      });
      const g = genRes?.data?.result || {};

      // Generate a cover image (best-effort).
      let coverImageUrl = '';
      try {
        const img = await base44.integrations.Core.GenerateImage({
          prompt: g.coverImagePrompt || `Modern, clean blog cover illustration about ${topic} for a SaaS deals marketplace. Vibrant, professional, no text.`,
        });
        const generatedUrl = img?.url || '';
        coverImageUrl = generatedUrl
          ? await mirrorToR2(base44, generatedUrl, slugify(g.slug || g.title || topic))
          : '';
      } catch (e) {
        console.error('blog cover image failed:', (e as Error).message);
      }

      const blog = {
        title: g.title || topic,
        slug: slugify(g.slug || g.title || topic),
        focusKeyword: g.focusKeyword || keyword || '',
        metaTitle: (g.metaTitle || g.title || topic).slice(0, 65),
        metaDescription: (g.metaDescription || g.excerpt || '').slice(0, 160),
        excerpt: g.excerpt || '',
        keywords: Array.isArray(g.keywords) ? g.keywords.slice(0, 8) : [],
        content: g.content || '',
        coverImageUrl,
      };
      return Response.json({ blog });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('storeBlogGenerate error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});