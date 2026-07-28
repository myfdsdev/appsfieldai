import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Marketing Studio media generation.
// Generates a promotional IMAGE or VIDEO using the admin-configured default
// AI & Engine media providers (imageProvider / videoProvider):
//   - base44 → Base44 built-in Core.GenerateImage / Core.GenerateVideo
//   - xai    → x.ai image API (video falls back to base44)
//   - kie    → Kie.ai Grok Imagine (createTask + poll)
//
// Called from the frontend (base44.functions.invoke('marketingGenerate', {...}))
// so provider API keys never leave the backend.

const KIE_CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_RECORD_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

// xAI image generation (grok image models). Returns the first image URL.
async function callXaiImage(apiKey: string, model: string, prompt: string) {
  const res = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || 'grok-2-image', prompt, n: 1 }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI image error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
  if (!url) throw new Error('xAI returned no image.');
  return url;
}

// Kie.ai — create a task and poll until it finishes.
async function callKie(apiKey: string, model: string, input: Record<string, unknown>) {
  const createRes = await fetch(KIE_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || createData?.code !== 200 || !createData?.data?.taskId) {
    console.error('Kie.ai createTask failed', createRes.status, JSON.stringify(createData));
    throw new Error(createData?.msg || `Kie.ai createTask failed (${createRes.status}).`);
  }
  const taskId = createData.data.taskId;
  const maxAttempts = 90; // ~6 minutes
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const recRes = await fetch(`${KIE_RECORD_URL}?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const recData = await recRes.json();
    const d = recData?.data;
    if (!recRes.ok || !d) continue;
    if (d.state === 'success') {
      let urls: string[] = [];
      try {
        const parsed = JSON.parse(d.resultJson || '{}');
        urls = parsed.resultUrls || [];
      } catch { /* ignore */ }
      if (!urls[0]) throw new Error('Kie.ai returned no result.');
      return urls[0];
    }
    if (d.state === 'fail') {
      console.error('Kie.ai task failed', d.failCode, d.failMsg);
      throw new Error(d.failMsg || 'Generation failed.');
    }
  }
  throw new Error('Generation timed out. Try again.');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mediaType, prompt, referenceImageUrls = [], aspectRatio = '1:1', duration = 8 } = body || {};
    if (!prompt) return Response.json({ error: 'prompt is required.' }, { status: 400 });
    if (mediaType !== 'image' && mediaType !== 'video') {
      return Response.json({ error: 'mediaType must be image or video.' }, { status: 400 });
    }

    // Resolve the admin-configured AI engine (media providers).
    let eng: Record<string, string> | null = null;
    try {
      const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
      eng = cfgs?.[0]?.aiEngine || null;
    } catch { /* fall back to base44 */ }

    const provider = mediaType === 'image' ? (eng?.imageProvider || 'base44') : (eng?.videoProvider || 'base44');
    const model = mediaType === 'image' ? (eng?.imageModel || '') : (eng?.videoModel || '');
    const firstRef = Array.isArray(referenceImageUrls) && referenceImageUrls.length ? referenceImageUrls[0] : null;

    // Map our UI ratios to Kie's accepted aspect_ratio values.
    const KIE_RATIO: Record<string, string> = {
      '1:1': '1:1', '16:9': '16:9', '9:16': '9:16', '4:5': '3:4', '4:3': '4:3', '3:4': '3:4',
    };
    const kieRatio = KIE_RATIO[aspectRatio] || '1:1';

    let url: string | null = null;

    if (mediaType === 'image') {
      if (provider === 'xai' && eng?.xaiApiKey) {
        url = await callXaiImage(eng.xaiApiKey, model, prompt);
      } else if (provider === 'kie' && eng?.kieAiApiKey) {
        // Kie Grok Imagine uses text-to-image vs image-to-image depending on
        // whether reference images were provided.
        const kieModel = firstRef ? 'grok-imagine/image-to-image' : 'grok-imagine/text-to-image';
        const input: Record<string, unknown> = { prompt, aspect_ratio: kieRatio };
        if (firstRef) input.image_urls = referenceImageUrls.slice(0, 5);
        url = await callKie(eng.kieAiApiKey, kieModel, input);
      } else {
        // Base44 built-in.
        const res = await base44.integrations.Core.GenerateImage({
          prompt,
          ...(referenceImageUrls.length ? { existing_image_urls: referenceImageUrls } : {}),
        });
        url = res?.url || null;
      }
    } else {
      // VIDEO
      if (provider === 'kie' && eng?.kieAiApiKey) {
        const kieModel = firstRef ? 'grok-imagine/image-to-video' : 'grok-imagine/text-to-video';
        const input: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio, duration };
        if (firstRef) input.image_urls = referenceImageUrls.slice(0, 5);
        url = await callKie(eng.kieAiApiKey, kieModel, input);
      } else {
        // Base44 built-in Veo (xai video not supported here → falls back to base44).
        const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
        const dur = [4, 6, 8].includes(Number(duration)) ? Number(duration) : 8;
        const res = await base44.integrations.Core.GenerateVideo({
          prompt,
          duration: dur,
          aspect_ratio: ratio,
        });
        url = res?.url || null;
      }
    }

    if (!url) return Response.json({ error: 'Generation returned no result.' }, { status: 502 });
    return Response.json({ url, provider });
  } catch (error) {
    console.error('marketingGenerate error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});