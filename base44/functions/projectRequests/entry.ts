import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  started: 'Started',
  in_progress: 'In Progress',
  done: 'Done',
};

// Project Requests management for the store owner's dashboard.
//  - action "list": return this store's project requests (auth + ownership).
//  - action "updateStatus": change a request's status, optionally emailing the client.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, marketplaceId } = body || {};
    if (!marketplaceId) {
      return Response.json({ error: 'marketplaceId is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Verify the caller owns (or admins) this store.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const mkts = await svc.entities.Marketplace.filter({ id: marketplaceId });
    const m = mkts?.[0];
    if (!m) return Response.json({ error: 'Store not found' }, { status: 404 });
    if (m.ownerId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'list') {
      const requests = await svc.entities.ProjectRequest.filter(
        { marketplaceId }, '-created_date', 500
      );
      return Response.json({ requests });
    }

    if (action === 'updateStatus') {
      const { requestId, status, note, notifyClient } = body || {};
      if (!requestId || !status) {
        return Response.json({ error: 'requestId and status are required' }, { status: 400 });
      }
      if (!STATUS_LABELS[status]) {
        return Response.json({ error: 'Invalid status' }, { status: 400 });
      }

      const existing = await svc.entities.ProjectRequest.filter({ id: requestId });
      const pr = existing?.[0];
      if (!pr || pr.marketplaceId !== marketplaceId) {
        return Response.json({ error: 'Project request not found' }, { status: 404 });
      }

      const patch: Record<string, unknown> = { status };
      if (typeof note === 'string') patch.statusNote = note;

      let emailed = false;
      if (notifyClient && pr.clientEmail) {
        try {
          await base44.functions.invoke('sendStoreEmail', {
            marketplaceId,
            templateKey: 'projectStatus',
            to: pr.clientEmail,
            vars: {
              customer_name: pr.clientName || 'there',
              project_title: pr.projectTitle || 'Your project',
              status_label: STATUS_LABELS[status],
              status_note: note || '',
            },
          });
          emailed = true;
          patch.lastStatusEmailAt = new Date().toISOString();
        } catch (e) {
          console.error('projectRequests status email failed:', e);
        }
      }

      await svc.entities.ProjectRequest.update(requestId, patch);
      return Response.json({ ok: true, emailed });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('projectRequests error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});