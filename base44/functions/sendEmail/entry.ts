import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reusable email sender backed by Resend.
// Payload: { to, subject, html, fromName?, fromEmail?, replyTo? }
// The "from" address must be on a domain you've verified in Resend.
// Falls back to Resend's shared onboarding sender if no verified from is provided.

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('RESEND_API_KEY not set');
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { to, subject, html, fromName, fromEmail, replyTo } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ error: 'Missing to, subject, or html' }, { status: 400 });
    }

    // Resolve the from address. Prefer an explicit sender, else fall back to the
    // app's verified sending address on appsfieldai.com.
    const resolvedFromEmail = fromEmail || 'info@appsfieldai.com';
    const resolvedFromName = fromName || 'AppsField AI';

    const from = `${resolvedFromName} <${resolvedFromEmail}>`;

    const payload: Record<string, unknown> = { from, to, subject, html };
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', res.status, JSON.stringify(data));
      return Response.json({ error: data?.message || 'Failed to send email', details: data }, { status: res.status });
    }

    return Response.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('sendEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});