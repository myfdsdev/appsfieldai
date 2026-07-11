import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns a cached voice sample URL, generating & storing it once on first use.
// Keyed by provider|voiceModel|voice so each distinct voice is generated a
// single time and replayed instantly on every later preview.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { voice, provider = 'base44', voiceModel = '', voiceInstructions = '', openaiApiKey = '', geminiApiKey = '', name } = await req.json();
    if (!voice) return Response.json({ error: 'voice is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const cacheKey = `${provider}|${voiceModel}|${voice}`;

    // Return the cached sample if we already generated it.
    const existing = await svc.entities.VoiceSample.filter({ cacheKey });
    if (existing?.[0]?.url) {
      return Response.json({ url: existing[0].url, cached: true });
    }

    // Generate the sample through aiVoice.
    const sampleText = `Hi, I'm ${(name || voice).replace(/\s*\(.*\)$/, '')}. This is how I sound.`;
    const res = await base44.functions.invoke('aiVoice', {
      text: sampleText,
      voice,
      provider,
      voiceModel,
      voiceInstructions,
      openaiApiKey,
      geminiApiKey,
    });
    const url = res?.data?.url;
    if (!url) return Response.json({ error: 'Could not generate sample' }, { status: 500 });

    // Store for next time (best-effort).
    try {
      await svc.entities.VoiceSample.create({ cacheKey, provider, voice, voiceModel, url });
    } catch (e) { console.error('voiceSample cache write failed:', e); }

    return Response.json({ url, cached: false });
  } catch (error) {
    console.error('voiceSample error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});