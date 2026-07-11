import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Text-to-speech routed through the same admin-configured AI engine.
//  - openai  → real OpenAI TTS API (audio/speech), returns a stored MP3 url
//  - base44 / gemini / fallback → Base44 built-in GenerateSpeech
// Gemini has no first-party TTS here, so it falls back to Base44.
//
// Invoked internally: base44.functions.invoke('aiVoice', { text, voice? })
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { text, voice, provider: overrideProvider, voiceModel: overrideModel, openaiApiKey: overrideKey } = await req.json();
    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    let eng = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back */ }

    // Overrides let the admin preview a voice before saving the config.
    const provider = overrideProvider || eng?.provider || 'base44';
    const openaiApiKey = overrideKey || eng?.openaiApiKey;
    const voiceModel = overrideModel || eng?.voiceModel;

    // OpenAI TTS — synthesize, then upload the MP3 to storage for a shareable url.
    if (provider === 'openai' && openaiApiKey) {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: voiceModel || 'gpt-4o-mini-tts',
          voice: voice || eng?.voiceName || 'alloy',
          input: text,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`OpenAI TTS ${res.status}: ${t}`);
      }
      const blob = await res.blob();
      const file = new File([blob], 'speech.mp3', { type: 'audio/mpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return Response.json({ url: file_url, provider: 'openai' });
    }

    // Base44 built-in (default / gemini fallback).
    const out = await base44.integrations.Core.GenerateSpeech({
      text,
      ...(voice ? { voice } : eng?.voiceName ? { voice: eng.voiceName } : {}),
    });
    return Response.json({ url: out?.url, provider: 'base44' });
  } catch (error) {
    console.error('aiVoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});