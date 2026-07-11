import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Speech-to-text routed through the same admin-configured AI engine.
//  - openai  → real OpenAI Whisper transcription API
//  - base44 / gemini / fallback → Base44 built-in TranscribeAudio
// Gemini has no first-party STT here, so it falls back to Base44.
//
// Invoked internally: base44.functions.invoke('aiTranscribe', { audioUrl })
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { audioUrl } = await req.json();
    if (!audioUrl) return Response.json({ error: 'audioUrl is required' }, { status: 400 });

    let eng = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back */ }

    // Transcription is a voice capability — follow the voice provider,
    // falling back to the legacy shared provider for old configs.
    const provider = eng?.voiceProvider || eng?.provider || 'base44';

    // OpenAI Whisper — fetch the audio and send it as multipart form data.
    if (provider === 'openai' && eng?.openaiApiKey) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Could not fetch audio (${audioRes.status})`);
      const blob = await audioRes.blob();
      const form = new FormData();
      form.append('file', new File([blob], 'audio.mp3', { type: blob.type || 'audio/mpeg' }));
      form.append('model', eng.transcribeModel || 'whisper-1');
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${eng.openaiApiKey}` },
        body: form,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`OpenAI transcription ${res.status}: ${t}`);
      }
      const data = await res.json();
      return Response.json({ text: data?.text || '', provider: 'openai' });
    }

    // Base44 built-in (default / gemini fallback).
    const out = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    return Response.json({ text: typeof out === 'string' ? out : (out?.text || ''), provider: 'base44' });
  } catch (error) {
    console.error('aiTranscribe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});