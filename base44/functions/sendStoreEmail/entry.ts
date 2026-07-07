import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import nodemailer from 'npm:nodemailer@6.9.14';

// Sends a store's transactional email for a given template key
// (welcome | orderConfirmation | reservation).
// - Uses the store's custom SMTP when smtpEnabled, else falls back to Resend.
// - Applies the owner-configured subject/body template with variable substitution.
// - For orderConfirmation, renders a branded HTML invoice (logo, itemized table,
//   product access links, dashboard button) built from the `order` payload.
// - No-ops silently (returns skipped) when the template is disabled.

const DEFAULTS: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Welcome to {{store_name}}!',
    body: 'Hi {{customer_name}},\n\nThanks for creating an account at {{store_name}}. You can now browse deals, reserve spots, and check out.\n\n— {{store_name}}',
  },
  orderConfirmation: {
    subject: 'Your order at {{store_name}} is confirmed',
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

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function money(n: number, currency: string): string {
  const val = (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${val}`;
}

// Wraps arbitrary body content in a clean, email-safe branded shell.
function shell(opts: { brand: string; logo?: string; storeName: string; inner: string; footer: string }): string {
  const logoBlock = opts.logo
    ? `<img src="${esc(opts.logo)}" alt="${esc(opts.storeName)}" style="max-height:44px;max-width:200px;display:block" />`
    : `<div style="font-size:20px;font-weight:700;color:#111">${esc(opts.storeName)}</div>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;">${logoBlock}</td></tr>
        <tr><td style="padding:28px 32px;color:#222;font-size:14px;line-height:1.6;">${opts.inner}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #eee;color:#999;font-size:12px;line-height:1.5;">${opts.footer}</td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

// Builds the branded invoice / order-confirmation body.
function orderConfirmationHtml(opts: {
  brand: string; logo?: string; storeName: string; supportEmail?: string;
  customerName: string; order: any; currency: string; dashboardUrl?: string;
}): string {
  const { brand, storeName, order, currency } = opts;
  const items = Array.isArray(order?.items) ? order.items : [];
  const rows = items.map((it: any) => {
    const lineTotal = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1);
    const access = order?.delivery?.accessUrl;
    const accessLink = access
      ? `<div style="margin-top:4px;"><a href="${esc(access)}" style="color:${esc(brand)};font-size:12px;text-decoration:none;">→ Access product</a></div>`
      : '';
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222;">${esc(it.listingTitle)}${accessLink}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">${Number(it.quantity) || 1}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222;text-align:right;white-space:nowrap;">${money(lineTotal, currency)}</td>
    </tr>`;
  }).join('');

  const paidBadge = order?.paymentStatus === 'paid'
    ? `<span style="display:inline-block;background:#e7f7ee;color:#1a8a4f;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">PAID</span>`
    : `<span style="display:inline-block;background:#fff4e5;color:#b26a00;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">PENDING PAYMENT</span>`;

  const dashboardBtn = opts.dashboardUrl
    ? `<div style="margin:24px 0 8px;">
        <a href="${esc(opts.dashboardUrl)}" style="display:inline-block;background:${esc(brand)};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:10px;">Open your dashboard</a>
      </div>`
    : '';

  const instructions = order?.delivery?.instructions
    ? `<div style="margin-top:20px;padding:16px;background:#f7f7fb;border-radius:10px;">
        <div style="font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Access instructions</div>
        <div style="font-size:14px;color:#333;white-space:pre-wrap;">${esc(order.delivery.instructions)}</div>
      </div>`
    : '';

  return `
    <h1 style="margin:0 0 4px;font-size:22px;color:#111;">Your order is confirmed 🎉</h1>
    <p style="margin:0 0 20px;color:#555;">Hi ${esc(opts.customerName)}, thanks for your purchase at <strong>${esc(storeName)}</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="font-size:13px;color:#888;">Order</td>
        <td style="font-size:13px;color:#222;text-align:right;font-family:monospace;">#${esc(String(order?.id || '').slice(-10))}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#888;padding-top:4px;">Status</td>
        <td style="text-align:right;padding-top:4px;">${paidBadge}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #222;">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px;">Item</th>
          <th style="text-align:center;padding:10px 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px;">Qty</th>
          <th style="text-align:right;padding:10px 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111;text-align:right;">Total</td>
          <td style="padding:14px 0 0;font-size:16px;font-weight:800;color:${esc(brand)};text-align:right;white-space:nowrap;">${money(order?.total, currency)}</td>
        </tr>
      </tfoot>
    </table>

    ${instructions}
    ${dashboardBtn}
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { marketplaceId, templateKey, to, vars, order, dashboardUrl } = await req.json();

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

    const brand = marketplace.branding?.primaryColor || '#f97316';
    const logo = marketplace.pageSections?.headerLogoUrl || marketplace.branding?.logo || '';
    const storeName = marketplace.name || 'Store';
    const currency = order?.currency || marketplace.currency || 'USD';
    const footer = `${esc(storeName)}${marketplace.supportEmail ? ` · <a href="mailto:${esc(marketplace.supportEmail)}" style="color:#999;">${esc(marketplace.supportEmail)}</a>` : ''}`;

    // Build HTML: rich branded invoice for order confirmations, otherwise the
    // plain-text template wrapped in the branded shell.
    let html: string;
    if (templateKey === 'orderConfirmation' && order) {
      const inner = orderConfirmationHtml({
        brand, logo, storeName, supportEmail: marketplace.supportEmail,
        customerName: mergedVars.customer_name || 'there', order, currency, dashboardUrl,
      });
      html = shell({ brand, logo, storeName, inner, footer });
    } else {
      const bodyText = applyVars((tpl?.body || def.body), mergedVars);
      const inner = `<div style="white-space:pre-wrap;">${esc(bodyText)}</div>`;
      html = shell({ brand, logo, storeName, inner, footer });
    }

    const bodyTextForPlain = applyVars((tpl?.body || def.body), mergedVars);
    const fromName = es.fromName || storeName;

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
        text: bodyTextForPlain,
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