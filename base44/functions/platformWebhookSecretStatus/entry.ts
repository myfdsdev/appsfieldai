import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Admin-only: reports whether the PLATFORM_WEBHOOK_SECRET app secret is configured.
// Never returns the secret value itself.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let configured = false;
    try {
      const val = secrets.get("PLATFORM_WEBHOOK_SECRET");
      configured = !!(val && String(val).trim());
    } catch {
      configured = false;
    }
    return Response.json({ configured });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}