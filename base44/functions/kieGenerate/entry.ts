import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generate an image or video via Kie.ai's Grok Imagine models.
// The Kie.ai API key is stored in AppConfig.aiEngine.kieAiApiKey (entered in admin settings).
// Flow: createTask -> poll recordInfo until state is success/fail -> return result URLs.

const CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const RECORD_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { model, input } = body || {};
    if (!model || !input) {
      return Response.json({ error: 'model and input are required.' }, { status: 400 });
    }

    // Read the Kie.ai key from the app config (service role — config is admin-owned).
    const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
    const apiKey = configs?.[0]?.aiEngine?.kieAiApiKey;
    if (!apiKey) {
      return Response.json({ error: 'No Kie.ai API key configured. Set it in Admin → AI & Engine settings.' }, { status: 400 });
    }

    // 1. Create the task.
    const createRes = await fetch(CREATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || createData?.code !== 200 || !createData?.data?.taskId) {
      console.error('Kie.ai createTask failed', createRes.status, JSON.stringify(createData));
      return Response.json({ error: createData?.msg || `Kie.ai createTask failed (${createRes.status}).` }, { status: 502 });
    }
    const taskId = createData.data.taskId;

    // 2. Poll for the result (video generation can take a while).
    // ~90 attempts * 4s = up to ~6 minutes.
    const maxAttempts = 90;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const recRes = await fetch(`${RECORD_URL}?taskId=${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const recData = await recRes.json();
      const d = recData?.data;
      if (!recRes.ok || !d) {
        console.error('Kie.ai recordInfo failed', recRes.status, JSON.stringify(recData));
        continue;
      }
      if (d.state === 'success') {
        let urls = [];
        try {
          const parsed = JSON.parse(d.resultJson || '{}');
          urls = parsed.resultUrls || [];
        } catch (e) {
          console.error('Kie.ai resultJson parse error', d.resultJson);
        }
        return Response.json({ taskId, state: 'success', urls, url: urls[0] || null });
      }
      if (d.state === 'fail') {
        console.error('Kie.ai task failed', d.failCode, d.failMsg);
        return Response.json({ taskId, state: 'fail', error: d.failMsg || 'Generation failed.' }, { status: 502 });
      }
      // else state === 'waiting' — keep polling.
    }

    return Response.json({ taskId, state: 'timeout', error: 'Generation timed out. Try again.' }, { status: 504 });
  } catch (error) {
    console.error('kieGenerate error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}