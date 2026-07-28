import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Update or delete a user on behalf of an app-admin (admin OR super_admin).
// Uses the service role because Base44's built-in User security only lets the
// platform `admin` role modify other users.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, userId, data } = body || {};
    if (!userId) return Response.json({ error: 'userId is required.' }, { status: 400 });

    if (action === 'delete') {
      await base44.asServiceRole.entities.User.delete(userId);
      return Response.json({ ok: true });
    }

    // Default: update. Only allow a safe whitelist of fields.
    const allowed = {};
    if (data && typeof data === 'object') {
      if ('full_name' in data) allowed.full_name = data.full_name;
      if ('role' in data) allowed.role = data.role;
      if ('planId' in data) allowed.planId = data.planId || null;
    }
    const updated = await base44.asServiceRole.entities.User.update(userId, allowed);
    return Response.json({ ok: true, user: updated });
  } catch (error) {
    console.error('adminUpdateUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});