import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STARTER_PLAN_ID = '6a2ab7221e85167f3e87a35c';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    let updated = 0;
    const skipped = [];

    for (const u of users) {
      if (u.planId === STARTER_PLAN_ID) {
        skipped.push(u.email);
        continue;
      }
      // Assign Starter plan. This only sets planId — store/marketplace data is untouched.
      await base44.asServiceRole.entities.User.update(u.id, { planId: STARTER_PLAN_ID });
      updated++;
    }

    return Response.json({ totalUsers: users.length, updated, alreadyStarter: skipped.length });
  } catch (error) {
    console.error('assignStarterToAllUsers error:', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});