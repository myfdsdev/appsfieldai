import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { deliverBroadcast } from '../../shared/broadcast.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Admins only' }, { status: 403 });
    }

    const { broadcastId } = await req.json();
    if (!broadcastId) return Response.json({ error: 'Missing broadcastId' }, { status: 400 });

    const broadcast = await base44.asServiceRole.entities.AdminBroadcast.get(broadcastId);
    if (!broadcast) return Response.json({ error: 'Announcement not found' }, { status: 404 });

    const result = await deliverBroadcast(base44, broadcast);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('sendBroadcast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});