import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import nodemailer from 'npm:nodemailer@6.9.14';

// Sends a store's transactional email for a given template key
// (welcome | orderConfirmation | reservation).
// - Uses the store's custom SMTP when smtpEnabled, else falls back to Resend.
// - Applies the owner-configured subject/body template with variable substitution.
// - No-ops silently (returns skipped) when the template is disabled — callers can
//   fire-and-forget without breaking their own flow.

const DEFAULTS: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Welcome to {{store_name}}!',
    body: 'Hi {{customer_name}},\n\nThanks for creating an account at {{store_name}}. You can now browse deals, reserve spots, and check out.\n\n— {{store_name}}',
  },
  orderConfirmation: {
    subject: 'Your order is confirmed',
    body: 'Hi {{customer_name}},\n\nYour order {{order_id}} at {{store_name}} has been placed. Total: {{order_total}}.\n\nThank you for your purchase!\n\n— {{store_name}}',
  },
  reservation: {
    subject: 'Your spot is reserved',
    body: 'Hi {{customer_name}},\n\nYour spot for "{{product_name}}" at {{store_name}} is reserved. We\'ll be in touch with next steps.\n\n— {{store_name}}',
  },
};

function applyVars(text: string, vars: Record<string, string>): string {
  let out = text || '';
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? '');
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, templateKey, to, vars } = await req.json();

    if (!marketplaceId || !templateKey || !to) {
      return Response.json({ error: 'Missing marketplaceId, templateKey, or to' }, { status: 400 });
    }

    const mpList = await base44.asServiceRole.entities.Marketplace.filter({ id: marketplaceId });
    const marketplace = mpList[0];
    if (!marketplace) return Response.json({ error: 'Store not found' }, { status: 404 });

    const es = marketplace.emailSettings || {};
    const tpl = es.templates?.[templateKey];

    // If the owner explicitly disabled this template, skip silently.
    if (tpl && tpl.enabled === false) {
      return Response.json({ success: true, skipped: 'template_disabled' });
    }

    const def = DEFAULTS[templateKey] || { subject: '', body: '' };
    const mergedVars = { store_name: marketplace.name || 'Store', ...(vars || {}) };
    const subject = applyVars((tpl?.subject || def.subject), mergedVars);
    const bodyText = applyVars((tpl?.body || def.body), mergedVars);
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222;white-space:pre-wrap">${bodyText.replace(/</g, '&lt;')}</div>`;

    const fromName = es.fromName || marketplace.name || 'Store';

    // ── Custom SMTP path ──
    if (es.smtpEnabled && es.smtpHost && es.smtpUsername && es.smtpPassword) {
      const fromEmail = es.fromEmail || es.smtpUsername;
      const transporter = nodemailer.createTransport({
        host: es.smtpHost,
        port: es.smtpPort || 587,
        secure: !!es.smtpSecure && (es.smtpPort === 465),
        auth: { user: es.smtpUsername, pass: es.smtpPassword },
      });
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text: bodyText,
      });
      return Response.json({ success: true, via: 'smtp' });
    }

    // ── Resend fallback (platform sender) ──
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) return Response.json({ error: 'No email transport configured' }, { status: 500 });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <info@appsfieldai.com>`,
        to,
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('sendStoreEmail Resend error:', res.status, JSON.stringify(data));
      return Response.json({ error: data?.message || 'Failed to send', details: data }, { status: res.status });
    }
    return Response.json({ success: true, via: 'resend', id: data?.id });
  } catch (error) {
    console.error('sendStoreEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});