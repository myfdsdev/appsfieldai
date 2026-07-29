import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Streams a marketing asset (image/video) back to the browser with a
// Content-Disposition: attachment header so the browser downloads the file
// directly instead of opening it in a new tab. The R2 CDN doesn't send CORS
// headers, so a client-side fetch/blob download is blocked — this proxies it.
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let fileUrl = url.searchParams.get('url');
    let filename = url.searchParams.get('filename') || '';
    if (!fileUrl) {
      const body = await req.json().catch(() => ({}));
      fileUrl = body?.url || '';
      filename = filename || body?.filename || '';
    }
    if (!filename) filename = 'download';
    if (!fileUrl) return new Response('Missing url', { status: 400 });

    // Only allow our own CDN / R2 assets to be proxied.
    const publicBase = Deno.env.get('R2_PUBLIC_URL_BASE') || '';
    const host = new URL(fileUrl).host;
    const allowedHosts = ['cdn.appsfieldai.com'];
    try { if (publicBase) allowedHosts.push(new URL(publicBase).host); } catch { /* ignore */ }
    if (!allowedHosts.includes(host)) {
      return new Response('Forbidden host', { status: 403 });
    }

    // Upgrade to https to avoid mixed-content blocking.
    const secureUrl = fileUrl.replace(/^http:\/\//, 'https://');
    const upstream = await fetch(secureUrl);
    if (!upstream.ok || !upstream.body) {
      return new Response('Upstream fetch failed', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('downloadAsset error', error);
    return new Response('Error', { status: 500 });
  }
});