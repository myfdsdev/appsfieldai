import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { persistToR2, callXaiImage, callKie } from '../../shared/marketingMedia.ts';

// Generates (once, then caches in the PresetThumbnail entity) a square preview
// thumbnail for a marketing preset using the admin-configured image provider
// (Grok Imagine via xai/kie, else Base44 built-in).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { presetId, mediaType = 'image', prompt, label } = body || {};
    if (!presetId || !prompt) return Response.json({ error: 'presetId and prompt are required.' }, { status: 400 });

    // Return the cached thumbnail if one already exists.
    const existing = await base44.asServiceRole.entities.PresetThumbnail.filter({ presetId });
    if (existing?.[0]?.url) return Response.json({ url: existing[0].url, cached: true });

    let eng: Record<string, string> | null = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back */ }

    const provider = eng?.imageProvider || 'base44';
    const thumbPrompt = `Marketing style thumbnail preview representing "${label || presetId}". ${prompt} Square 1:1 composition, vibrant, clean, no text or watermark.`;

    let url: string | null = null;
    if (provider === 'xai' && eng?.xaiApiKey) {
      url = await callXaiImage(eng.xaiApiKey, eng?.imageModel || '', thumbPrompt);
    } else if (provider === 'kie' && eng?.kieAiApiKey) {
      if (eng?.imageModel === 'google/nano-banana') {
        url = await callKie(eng.kieAiApiKey, 'google/nano-banana', { prompt: thumbPrompt, image_size: '1:1', output_format: 'png' }, 45);
      } else {
        url = await callKie(eng.kieAiApiKey, 'grok-imagine/text-to-image', { prompt: thumbPrompt, aspect_ratio: '1:1' }, 45);
      }
    } else {
      const res = await base44.integrations.Core.GenerateImage({ prompt: thumbPrompt });
      url = res?.url || null;
    }
    if (!url) return Response.json({ error: 'Thumbnail generation returned no result.' }, { status: 502 });

    let finalUrl = url;
    try { finalUrl = await persistToR2(url, `marketing/presets/${presetId}`, 'image'); } catch (e) { console.error('persist err', e); }

    // Cache it (guard against a race by re-checking).
    const recheck = await base44.asServiceRole.entities.PresetThumbnail.filter({ presetId });
    if (recheck?.[0]) {
      if (!recheck[0].url) await base44.asServiceRole.entities.PresetThumbnail.update(recheck[0].id, { url: finalUrl });
      return Response.json({ url: recheck[0].url || finalUrl });
    }
    await base44.asServiceRole.entities.PresetThumbnail.create({ presetId, mediaType, url: finalUrl });
    return Response.json({ url: finalUrl });
  } catch (error) {
    console.error('marketingPresetThumbnail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});