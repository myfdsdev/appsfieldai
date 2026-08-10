import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { deliverBroadcast } from '../../shared/broadcast.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pending = await base44.asServiceRole.entities.AdminBroadcast.filter({ status: 'scheduled' });
    const now = Date.now();
    let sent = 0;

    for (const b of pending) {
      if (b.scheduleMode !== 'scheduled' || !b.scheduledAt) continue;
      if (new Date(b.scheduledAt).getTime() > now) continue;
      await deliverBroadcast(base44, b);
      sent++;
    }

    return Response.json({ success: true, sent });
  } catch (error) {
    console.error('dispatchScheduledBroadcasts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});