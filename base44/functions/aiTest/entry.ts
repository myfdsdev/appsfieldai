import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Quick connectivity test for the admin-configured AI engine.
// Admin-only. Sends a tiny prompt through the same routing as aiGenerate
// and reports whether the provider + key work.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    // Optional override — test the values currently in the form before saving.
    const overrides = await req.json().catch(() => ({}));

    let eng = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back */ }

    const provider = overrides.provider || eng?.provider || 'base44';
    const model = overrides.model || eng?.model || '';
    const openaiApiKey = overrides.openaiApiKey || eng?.openaiApiKey || '';
    const geminiApiKey = overrides.geminiApiKey || eng?.geminiApiKey || '';

    const prompt = 'Reply with the single word: OK';

    if (provider === 'openai') {
      if (!openaiApiKey) return Response.json({ ok: false, provider, error: 'No OpenAI API key set.' });
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 5 }),
      });
      if (!res.ok) {
        const t = await res.text();
        return Response.json({ ok: false, provider, error: `OpenAI ${res.status}: ${t.slice(0, 300)}` });
      }
      return Response.json({ ok: true, provider, message: 'OpenAI connection successful.' });
    }

    if (provider === 'gemini') {
      if (!geminiApiKey) return Response.json({ ok: false, provider, error: 'No Gemini API key set.' });
      const m = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) {
        const t = await res.text();
        return Response.json({ ok: false, provider, error: `Gemini ${res.status}: ${t.slice(0, 300)}` });
      }
      return Response.json({ ok: true, provider, message: 'Gemini connection successful.' });
    }

    // Base44 built-in — always available.
    await base44.integrations.Core.InvokeLLM({ prompt });
    return Response.json({ ok: true, provider: 'base44', message: 'Base44 built-in AI is working.' });
  } catch (error) {
    console.error('aiTest error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});