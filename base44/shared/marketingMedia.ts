import { AwsClient } from 'npm:aws4fetch@1.0.20';

// Shared media helpers used by marketingGenerate and marketingPresetThumbnail.

export const KIE_CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
export const KIE_RECORD_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

// Download a generated media URL and persist it to Cloudflare R2, returning a
// permanent public URL. Provider URLs (Kie/xAI/Veo) are temporary and expire.
export async function persistToR2(sourceUrl: string, keyPrefix: string, mediaType = 'image'): Promise<string> {
  const endpoint = (Deno.env.get('R2_ENDPOINT') || '').replace(/\/$/, '');
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  const publicBase = (Deno.env.get('R2_PUBLIC_URL_BASE') || '').replace(/\/$/, '');
  if (!endpoint || !bucket || !publicBase) return sourceUrl; // R2 not configured → keep original

  const srcRes = await fetch(sourceUrl);
  if (!srcRes.ok) return sourceUrl;
  const type = srcRes.headers.get('content-type') || (mediaType === 'video' ? 'video/mp4' : 'image/png');
  const bytes = new Uint8Array(await srcRes.arrayBuffer());
  const ext = (type.split('/')[1] || (mediaType === 'video' ? 'mp4' : 'png')).split(';')[0];
  const key = `${keyPrefix}_${Date.now()}.${ext}`;

  const aws = new AwsClient({
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
    service: 's3',
    region: 'auto',
  });
  const putRes = await aws.fetch(`${endpoint}/${bucket}/${key}`, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': type },
  });
  if (!putRes.ok) {
    console.error('persistToR2 failed', putRes.status, await putRes.text());
    return sourceUrl;
  }
  return `${publicBase}/${key}`;
}

// xAI image generation (grok image models). Returns the first image URL.
export async function callXaiImage(apiKey: string, model: string, prompt: string) {
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

// Kie.ai — create a task and poll until it finishes. Returns the first result URL.
export async function callKie(apiKey: string, model: string, input: Record<string, unknown>, maxAttempts = 90) {
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