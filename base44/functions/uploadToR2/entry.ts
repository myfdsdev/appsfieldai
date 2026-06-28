import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.600.0';

// Uploads an image/video to Cloudflare R2 (S3-compatible) and returns the public URL.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    const campaignId = (formData.get('campaignId') || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '-');

    const endpoint = Deno.env.get('R2_ENDPOINT');
    const bucket = Deno.env.get('R2_BUCKET_NAME');
    const publicBase = (Deno.env.get('R2_PUBLIC_URL_BASE') || '').replace(/\/$/, '');

    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    // Path: uploads/{user_id}/{campaign_id}_{timestamp}.{ext}
    const nameExt = (file.name || '').includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const ext = nameExt || ((file.type || '').split('/')[1] || 'bin');
    const key = `uploads/${user.id}/${campaignId}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || 'application/octet-stream',
    }));

    return Response.json({ fileUrl: `${publicBase}/${key}`, key });
  } catch (error) {
    console.error('uploadToR2 error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});