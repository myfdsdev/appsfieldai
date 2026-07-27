import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Disconnect the owner's Telegram — clears the stored chat id so alerts stop.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await base44.asServiceRole.entities.User.update(user.id, {
      telegramChatId: '',
      telegramUsername: '',
      telegramConnectCode: '',
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('telegramDisconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}