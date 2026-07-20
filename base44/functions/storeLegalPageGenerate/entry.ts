import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// Generates the content of a generic legal/info page (Privacy Policy, Terms of
// Service, Refund Policy, About, Contact) from the store's business details.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { marketplaceId, pageType, supportEmail, website, contact, location } = body || {};
    if (!marketplaceId) return Response.json({ error: 'marketplaceId is required' }, { status: 400 });
    if (!pageType) return Response.json({ error: 'pageType is required' }, { status: 400 });

    const marketplace = await base44.entities.Marketplace.get(marketplaceId);
    if (!marketplace) return Response.json({ error: 'Marketplace not found' }, { status: 404 });

    const storeName = marketplace.name || 'this marketplace';
    const description = (marketplace.description || '').trim();

    const details = [
      supportEmail ? `Support email: ${supportEmail}` : '',
      website ? `Website: ${website}` : '',
      contact ? `Contact info: ${contact}` : '',
      location ? `Business location: ${location}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are a legal content writer. Write a clear, professional "${pageType}" page for an online SaaS deals marketplace called "${storeName}".
${description ? `Store description: ${description}` : ''}
Business details to use where relevant:
${details || '(no extra details provided — use sensible generic placeholders and clearly mark them)'}

Write it in MARKDOWN with proper headings and sections appropriate for a "${pageType}" page. Use the provided contact/location details in the relevant sections (e.g. contact section, data-controller/company details). Keep it practical and readable — not overly verbose. Include a short note that this is a template and should be reviewed for the store's jurisdiction. Do NOT invent a company registration number or specific laws unless generic.`;

    const genRes = await base44.functions.invoke('aiGenerate', { prompt });
    const content = genRes?.data?.result || '';

    return Response.json({ content: typeof content === 'string' ? content : String(content) });
  } catch (error) {
    console.error('storeLegalPageGenerate error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});