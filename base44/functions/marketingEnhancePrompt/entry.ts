import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Magic prompt enhancer for the Marketing Studio.
// Takes the store's page content + a chosen marketing preset + the user's raw
// input text, and produces a polished, production-grade generation prompt for a
// promotional image or a UGC-style promo video (with a natural spoken script).
//
// Routes text generation through the app's aiGenerate function so it uses the
// admin's configured LLM provider.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mediaType, storeContext = '', presetLabel = '', presetPrompt = '', userInput = '', aspectRatio = '1:1', duration = 8 } = body || {};
    if (mediaType !== 'image' && mediaType !== 'video') {
      return Response.json({ error: 'mediaType must be image or video.' }, { status: 400 });
    }

    const commonContext = `
STORE / SOFTWARE CONTEXT (use this to make the ad specific and believable — pull the real product name, benefits, and audience from it):
${storeContext || '(no store context provided)'}

MARKETING STYLE PRESET: ${presetLabel || 'None'}
PRESET DIRECTION: ${presetPrompt || '(none)'}

USER'S EXTRA INSTRUCTIONS (highest priority — if they mention a specific software/feature, focus the ad on it):
${userInput || '(none)'}
`.trim();

    let prompt: string;
    let schema: Record<string, unknown>;

    if (mediaType === 'image') {
      prompt = `You are a world-class performance-marketing creative director specializing in UGC-style software ads.
Write ONE highly detailed image-generation prompt for a scroll-stopping promotional graphic.

${commonContext}

REQUIREMENTS:
- Focus on authentic, UGC / real-human style advertising (a real person using or reacting to the software), unless the preset direction clearly calls for a pure product/feature graphic.
- Describe subject, setting, composition, lighting, mood, camera angle, and where any UI/laptop/phone screen appears.
- Bake in on-image ad copy: a punchy HEADLINE, a short supporting line, and a clear CALL TO ACTION — describe their placement and style in the prompt.
- Make it specific to the store/software above. If the user named a specific product/feature, center the ad on it.
- Target aspect ratio: ${aspectRatio}. Keep composition safe for that ratio.
- Photorealistic, high quality, modern, professional. No watermarks.

Return the final image prompt plus the marketing copy you baked in.`;
      schema = {
        type: 'object',
        properties: {
          enhancedPrompt: { type: 'string', description: 'The full, detailed image-generation prompt.' },
          headline: { type: 'string' },
          description: { type: 'string' },
          cta: { type: 'string' },
        },
        required: ['enhancedPrompt'],
      };
    } else {
      prompt = `You are a world-class UGC video ad creative director for software products.
Write ONE highly detailed video-generation prompt for a photorealistic, authentic UGC-style promo video (TikTok / Instagram Reels style), including a natural spoken script.

${commonContext}

Use this proven UGC structure as your baseline and adapt it to the store/software:
- A real person speaks directly to the camera (handheld selfie style), natural facial expressions, head movement, realistic lip-sync, blinking and micro-expressions.
- Casual, relatable, authentic — natural lighting, slight film grain, not overly polished.
- Camera and movement directions.
- Aspect ratio: ${aspectRatio}. Duration: about ${duration} seconds.
- Include a conversational SCRIPT the person says, ${duration <= 6 ? 'short (1–2 sentences)' : '2–4 sentences'}, that hooks the viewer, names the product's real benefit (from the store context), and ends with a clear call to action.
- End the prompt with an explicit instruction to perfectly sync lip movements to the spoken audio.

If the user named a specific software/feature, make the person talk about THAT.
Return the final video prompt and the spoken script separately.`;
      schema = {
        type: 'object',
        properties: {
          enhancedPrompt: { type: 'string', description: 'The full, detailed video-generation prompt including camera/style/script.' },
          script: { type: 'string', description: 'The conversational spoken script only.' },
        },
        required: ['enhancedPrompt'],
      };
    }

    const res = await base44.functions.invoke('aiGenerate', { prompt, jsonSchema: schema });
    const result = res?.data?.result || {};
    return Response.json({ ...result });
  } catch (error) {
    console.error('marketingEnhancePrompt error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});