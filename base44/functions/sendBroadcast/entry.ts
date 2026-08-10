import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { deliverBroadcast, deliverTest } from '../../shared/broadcast.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Admins only' }, { status: 403 });
    }

    const body = await req.json();

    // Test send — deliver the draft to the admin only, nothing is broadcast.
    if (body.test) {
      const result = await deliverTest(base44, body.broadcast || {}, me);
      return Response.json({ success: true, test: true, ...result });
    }

    if (!body.broadcastId) return Response.json({ error: 'Missing broadcastId' }, { status: 400 });

    const broadcast = await base44.asServiceRole.entities.AdminBroadcast.get(body.broadcastId);
    if (!broadcast) return Response.json({ error: 'Announcement not found' }, { status: 404 });

    const result = await deliverBroadcast(base44, broadcast);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('sendBroadcast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});