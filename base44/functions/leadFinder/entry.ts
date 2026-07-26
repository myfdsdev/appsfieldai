import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import nodemailer from 'npm:nodemailer@6.9.16';

// Lead Finder backend: find business leads via the AI engine (with internet
// context), generate personalized invite emails, and send them through the
// store owner's own SMTP settings. Store owners only — gated by a plan flag.

function firstName(business: string) {
  return (business || '').trim().split(/\s+/)[0] || 'there';
}

function applyVars(tpl: string, vars: Record<string, string>) {
  return (tpl || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    // ── Find leads ──────────────────────────────────────────────
    if (action === 'findLeads') {
      const { niche, area, count } = body;
      if (!niche || !area) return Response.json({ error: 'Niche and area are required' }, { status: 400 });
      const n = Math.min(Math.max(parseInt(count) || 10, 1), 30);

      // Which contact fields the returned leads MUST have (email, phone, website, instagram, facebook).
      const FIELD_LABELS: Record<string, string> = {
        email: 'a real public contact email address',
        phone: 'a contact phone number',
        website: 'a website URL',
        instagram: 'an Instagram profile URL',
        facebook: 'a Facebook page URL',
      };
      const requireFields: string[] = Array.isArray(body.requireFields)
        ? body.requireFields.filter((f: string) => FIELD_LABELS[f])
        : [];
      const requireLine = requireFields.length
        ? `IMPORTANT: Only include a business if you can find ALL of the following for it: ` +
          `${requireFields.map((f) => FIELD_LABELS[f]).join(', ')}. ` +
          `Skip any business that is missing any of these — do not include it even to reach the count. ` +
          `It is better to return fewer businesses than to include one missing a required field. `
        : '';

      const prompt = `You are a B2B lead researcher. Find ${n} real ${niche} businesses located in ${area}. ` +
        `Use your knowledge and available web context to return genuine, existing businesses (not invented ones). ` +
        `For each business, work hard to find a real contact email address: check the business's own website ` +
        `(look at its home, contact, about and footer pages), its Google Business listing, and its Instagram/Facebook ` +
        `profiles for a publicly listed email. Prioritise returning businesses that have a findable contact email. ` +
        requireLine +
        `For each, provide the business name, a one-sentence description, any publicly listed contact emails (can be multiple), ` +
        `a contact phone number, website URL, Instagram profile URL, and Facebook page URL. ` +
        `Leave a field as an empty string if you genuinely cannot find it. Do NOT fabricate or guess emails or phone numbers — ` +
        `only return a contact email you actually found in a public source.`;

      const jsonSchema = {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                businessName: { type: 'string' },
                description: { type: 'string' },
                emails: { type: 'array', items: { type: 'string' } },
                phone: { type: 'string' },
                website: { type: 'string' },
                instagram: { type: 'string' },
                facebook: { type: 'string' },
              },
            },
          },
        },
      };

      // Resolve admin AI engine; if it's base44/no external key, use InvokeLLM
      // with internet context for the best real-world results.
      let eng: any = null;
      try {
        const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
        eng = cfgs?.[0]?.aiEngine || null;
      } catch { /* fall back */ }
      const provider = eng?.provider || 'base44';

      let parsed: any;
      if ((provider === 'openai' && eng?.openaiApiKey) || (provider === 'gemini' && eng?.geminiApiKey)) {
        const resp = await base44.functions.invoke('aiGenerate', { prompt, jsonSchema });
        parsed = resp?.data?.result || resp?.result || resp;
      } else {
        parsed = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: jsonSchema,
          model: 'gemini_3_flash',
        });
      }

      let rawLeads = Array.isArray(parsed?.leads) ? parsed.leads : [];
      // Enforce the required fields — drop any lead missing a selected field.
      if (requireFields.length) {
        rawLeads = rawLeads.filter((l: any) => requireFields.every((f) => {
          if (f === 'email') return Array.isArray(l.emails) ? l.emails.some(Boolean) : !!l.emails;
          return !!(l[f] && String(l[f]).trim());
        }));
      }
      const created = [];
      for (const l of rawLeads.slice(0, n)) {
        const rec = await base44.asServiceRole.entities.FoundLead.create({
          ownerId: user.id,
          businessName: l.businessName || 'Unknown business',
          description: l.description || '',
          emails: Array.isArray(l.emails) ? l.emails.filter(Boolean) : (l.emails ? [l.emails] : []),
          phone: l.phone || '',
          website: l.website || '',
          instagram: l.instagram || '',
          facebook: l.facebook || '',
          niche,
          area,
          shortlisted: false,
          contactStatus: 'new',
        });
        created.push(rec);
      }
      return Response.json({ success: true, leads: created });
    }

    // ── Generate a personalized email (for the template generator) ──
    if (action === 'generateEmail') {
      const { storeName, offering, tone, purpose, storeLink, products } = body;
      const productLines = Array.isArray(products) && products.length
        ? `The store sells these products/software/services the owner can mention as helpful for the recipient's business:\n` +
          products.map((p: any) => `- ${p.name}${p.short ? `: ${p.short}` : ''}`).join('\n') + `\n`
        : '';
      const prompt = `Write a short, warm B2B cold outreach email inviting a business owner to check out "${storeName}", ` +
        `a store that offers: ${offering || 'software products'}. Goal: ${purpose || 'invite them to explore and buy software from the store'}. ` +
        `Tone: ${tone || 'friendly and professional'}. ` +
        productLines +
        `Structure the email so the FIRST paragraph is personalized to the recipient — greet them by {{first_name}} and reference their business {{business_name}}, ` +
        `and explain how a product/software/service from the store can specifically help their business. ` +
        `Then invite them to visit the store to find the software their business needs at the best affordable price, ` +
        `and include the store link exactly as the placeholder {{store_link}} (write it as a clickable-looking URL line). ` +
        `Keep it under 140 words. Use these placeholders literally so they can be personalized later: ` +
        `{{first_name}} for the recipient's first name, {{business_name}} for their business, {{store_name}} for the store, and {{store_link}} for the store URL. ` +
        `Return a subject line and a body.`;
      const jsonSchema = {
        type: 'object',
        properties: { subject: { type: 'string' }, body: { type: 'string' } },
      };
      const resp = await base44.functions.invoke('aiGenerate', { prompt, jsonSchema });
      const result = resp?.data?.result || resp?.result || resp;
      return Response.json({ success: true, subject: result?.subject || '', body: result?.body || '' });
    }

    // ── Check the owner's SMTP is configured ──
    if (action === 'checkSmtp') {
      const s = user.leadFinderSmtp || {};
      const ok = !!(s.enabled && s.host && s.username && s.password);
      return Response.json({ ok });
    }

    // ── Send a test email using the owner's SMTP settings ──
    if (action === 'sendTest') {
      // Prefer settings passed from the form (lets owner test before saving), else saved ones.
      const s = body.smtp || user.leadFinderSmtp || {};
      if (!(s.host && s.username && s.password)) {
        return Response.json({ error: 'Please fill in SMTP host, username and password first.' }, { status: 400 });
      }
      const to = (body.toEmail || '').trim() || user.email;
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return Response.json({ error: 'A valid recipient email is required' }, { status: 400 });
      }
      const fromEmail = s.fromEmail || s.username;
      const fromName = s.fromName || user.full_name || 'Lead Finder';
      const port = parseInt(s.port) || 587;
      try {
        const transporter = nodemailer.createTransport({
          host: s.host,
          port,
          secure: !!s.secure && port === 465,
          auth: { user: s.username, pass: s.password },
        });
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject: 'Test email from Lead Finder',
          html: `<div style="font-family:sans-serif;line-height:1.6;"><p>✅ Your SMTP settings are working!</p><p>This is a test email sent from your Lead Finder outreach configuration.</p></div>`,
        });
      } catch (e) {
        console.error('leadFinder sendTest error:', e?.message || e);
        return Response.json({ error: e?.message || 'Could not send test email — check your SMTP settings.' }, { status: 400 });
      }
      return Response.json({ success: true, to });
    }

    // ── Send an invite email to one lead ──
    if (action === 'sendEmail') {
      const { leadId, subject, htmlBody, toEmail } = body;
      const s = user.leadFinderSmtp || {};
      if (!(s.enabled && s.host && s.username && s.password)) {
        return Response.json({ error: 'SMTP not configured' }, { status: 400 });
      }
      const lead = await base44.asServiceRole.entities.FoundLead.get(leadId).catch(() => null);
      if (!lead || lead.ownerId !== user.id) return Response.json({ error: 'Lead not found' }, { status: 404 });
      // Recipient: prefer the address the owner entered/confirmed, else the first found email.
      const to = (toEmail || '').trim() || (lead.emails || [])[0];
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return Response.json({ error: 'A valid recipient email is required' }, { status: 400 });
      }
      // Persist a manually-entered email back onto the lead so it shows next time.
      const existing = lead.emails || [];
      const emailsUpdate = existing.includes(to) ? existing : [to, ...existing];

      const fromEmail = s.fromEmail || s.username;
      const fromName = s.fromName || user.full_name || 'Lead Finder';
      const transporter = nodemailer.createTransport({
        host: s.host,
        port: s.port || 587,
        secure: !!s.secure && (s.port === 465),
        auth: { user: s.username, pass: s.password },
      });
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: subject || 'Hello',
        html: htmlBody || '',
      });
      const sentAt = new Date().toISOString();
      await base44.asServiceRole.entities.FoundLead.update(leadId, {
        emails: emailsUpdate,
        contactStatus: 'emailed',
        lastEmailedAt: sentAt,
      });
      // Log to email history
      await base44.asServiceRole.entities.LeadEmail.create({
        ownerId: user.id,
        leadId,
        businessName: lead.businessName || '',
        toEmail: to,
        subject: subject || '',
        sentAt,
      }).catch(() => {});
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('leadFinder error:', error?.message || error);
    return Response.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
});

// personalization helper exposed for potential reuse
export { firstName, applyVars };