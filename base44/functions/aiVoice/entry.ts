import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Text-to-speech routed through the same admin-configured AI engine.
//  - openai  → real OpenAI TTS API (audio/speech), returns a stored MP3 url
//  - gemini  → real Gemini TTS API (returns PCM, wrapped into a WAV), stored url
//  - base44 / fallback → Base44 built-in GenerateSpeech
//
// Overrides (provider, voiceModel, voiceInstructions, openaiApiKey, geminiApiKey)
// let the admin preview a voice before saving the config.
// Invoked internally: base44.functions.invoke('aiVoice', { text, voice? })

// Wrap raw PCM (16-bit, mono) into a minimal WAV container so browsers can play it.
function pcmToWav(pcmBytes: Uint8Array, sampleRate = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, pcmBytes.length, true);
  new Uint8Array(buffer, 44).set(pcmBytes);
  return new Uint8Array(buffer);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      text,
      voice,
      provider: overrideProvider,
      voiceModel: overrideModel,
      voiceInstructions: overrideInstructions,
      openaiApiKey: overrideOpenaiKey,
      geminiApiKey: overrideGeminiKey,
    } = await req.json();
    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    let eng = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back */ }

    // Overrides let the admin preview a voice before saving the config.
    const provider = overrideProvider || eng?.provider || 'base44';
    const openaiApiKey = overrideOpenaiKey || eng?.openaiApiKey;
    const geminiApiKey = overrideGeminiKey || eng?.geminiApiKey;
    const voiceModel = overrideModel || eng?.voiceModel;
    const instructions = (overrideInstructions ?? eng?.voiceInstructions ?? '').trim();

    // OpenAI TTS — synthesize, then upload the MP3 to storage for a shareable url.
    if (provider === 'openai' && openaiApiKey) {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: voiceModel || 'gpt-4o-mini-tts',
          voice: voice || eng?.voiceName || 'alloy',
          input: text,
          ...(instructions ? { instructions } : {}),
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

    // Gemini TTS — native prebuilt voices; returns base64 PCM we wrap into a WAV.
    if (provider === 'gemini' && geminiApiKey) {
      const model = voiceModel || 'gemini-2.5-flash-preview-tts';
      // Voice instructions are prepended as a natural-language style prompt.
      const promptText = instructions ? `${instructions}: ${text}` : text;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice || eng?.voiceName || 'Zephyr' },
                },
              },
            },
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini TTS ${res.status}: ${t}`);
      }
      const data = await res.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error('Gemini TTS returned no audio');
      const pcm = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const wav = pcmToWav(pcm, 24000);
      const file = new File([wav], 'speech.wav', { type: 'audio/wav' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return Response.json({ url: file_url, provider: 'gemini' });
    }

    // Base44 built-in (default).
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