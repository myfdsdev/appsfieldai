import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Shared AI text/JSON generation used by store auto-build and Deal Maker chat.
// Routes to the admin-configured provider:
//  - base44  → Base44 built-in InvokeLLM (default / fallback)
//  - openai  → real OpenAI Chat Completions API (key pasted in AI Engine settings)
//  - gemini  → real Google Gemini generateContent API (key pasted in AI Engine settings)
//
// Invoked internally (base44.functions.invoke('aiGenerate', { prompt, jsonSchema? }))
// so the API keys never leave the backend.

async function callOpenAI(apiKey: string, model: string, prompt: string, jsonSchema: unknown) {
  const body: Record<string, unknown> = {
    model: model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  };
  if (jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'result', strict: false, schema: jsonSchema },
    };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return jsonSchema ? JSON.parse(content) : content;
}

async function callGemini(apiKey: string, model: string, prompt: string, jsonSchema: unknown) {
  // Map retired/legacy model ids to current live equivalents so old saved
  // configs don't 404 (Google retires older models like gemini-2.0-flash).
  const RETIRED: Record<string, string> = {
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-pro',
  };
  const m = RETIRED[model] || model || 'gemini-2.5-flash';
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };
  if (jsonSchema) {
    body.generationConfig = { response_mime_type: 'application/json', response_schema: jsonSchema };
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  return jsonSchema ? JSON.parse(content) : content;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { prompt, jsonSchema } = await req.json();
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

    // Resolve the admin-configured AI engine.
    let eng = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back to base44 */ }

    const provider = eng?.provider || 'base44';

    // OpenAI — real API when provider selected and a key is present.
    if (provider === 'openai' && eng?.openaiApiKey) {
      const result = await callOpenAI(eng.openaiApiKey, eng.model, prompt, jsonSchema);
      return Response.json({ result, provider: 'openai' });
    }

    // Gemini — real API when provider selected and a key is present.
    if (provider === 'gemini' && eng?.geminiApiKey) {
      const result = await callGemini(eng.geminiApiKey, eng.model, prompt, jsonSchema);
      return Response.json({ result, provider: 'gemini' });
    }

    // Base44 built-in (default) or fallback when no external key is configured.
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      ...(jsonSchema ? { response_json_schema: jsonSchema } : {}),
    });
    return Response.json({ result, provider: 'base44' });
  } catch (error) {
    console.error('aiGenerate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});