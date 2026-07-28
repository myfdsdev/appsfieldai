import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns ALL users for the admin User Manager.
// Base44's built-in User security only lets the platform `admin` role list
// other users — so a `super_admin` (our app's own elevated role) would get an
// empty list via the client SDK. This function uses the service role so any
// app-admin (admin OR super_admin) can see everyone.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    return Response.json({ users });
  } catch (error) {
    console.error('adminListUsers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});