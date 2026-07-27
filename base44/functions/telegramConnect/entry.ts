import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { getBotUsername, ensureTelegramWebhook } from '../../shared/telegram.ts';

// Returns everything the "Telegram" settings tab needs:
//  - the bot deep link (t.me/<bot>?start=<code>) the owner scans/taps to connect
//  - the owner's current connection status (chat id / username)
// A one-time connect code is stored on the user so the webhook can match the
// person who starts the bot back to this account.
function genCode() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const botUsername = await getBotUsername();
    if (!botUsername) {
      return Response.json({ error: 'Telegram bot is not configured on this platform.' }, { status: 503 });
    }

    // Make sure Telegram is pointed at our webhook so /start connects work.
    await ensureTelegramWebhook(secrets.get('BASE44_APP_ID'));

    // Reuse an existing connect code, or mint one.
    let code = user.telegramConnectCode;
    if (!code) {
      code = genCode();
      await base44.asServiceRole.entities.User.update(user.id, { telegramConnectCode: code });
    }

    const deepLink = `https://t.me/${botUsername}?start=${code}`;

    return Response.json({
      botUsername,
      deepLink,
      connected: !!user.telegramChatId,
      telegramChatId: user.telegramChatId || '',
      telegramUsername: user.telegramUsername || '',
    });
  } catch (error) {
    console.error('telegramConnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}