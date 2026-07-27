import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTelegramMessage } from '../../shared/telegram.ts';

// Telegram webhook — Telegram calls this whenever the bot receives a message.
// The only message we care about is the "/start <code>" the owner sends by
// tapping their personal deep link. We match <code> to a User (telegramConnectCode)
// and store that chat's id so agent alerts can reach them.
//
// This endpoint is called by Telegram with NO user auth, so it uses the service role.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const update = await req.json().catch(() => ({}));

    const msg = update?.message;
    const chat = msg?.chat;
    const text = (msg?.text || '').trim();
    if (!chat?.id || !text) {
      return Response.json({ ok: true });
    }

    // "/start <code>" — connect flow.
    const startMatch = text.match(/^\/start\s+(\S+)/);
    if (startMatch) {
      const code = startMatch[1];
      const users = await base44.asServiceRole.entities.User.filter({ telegramConnectCode: code });
      const owner = users?.[0];
      if (owner) {
        const uname = chat.username ? `@${chat.username}` : (chat.first_name || '');
        await base44.asServiceRole.entities.User.update(owner.id, {
          telegramChatId: String(chat.id),
          telegramUsername: uname,
        });
        await sendTelegramMessage(
          chat.id,
          `✅ <b>Connected!</b>\nYou'll now get instant alerts here whenever you get a new lead or a new sale. 🚀`
        );
      } else {
        await sendTelegramMessage(
          chat.id,
          `Hmm, that connection link looks expired. Open the Telegram tab in your account settings and scan the QR code again.`
        );
      }
      return Response.json({ ok: true });
    }

    // Any other message — friendly hint.
    if (/^\/start$/.test(text) || /^\/help$/.test(text)) {
      await sendTelegramMessage(
        chat.id,
        `👋 To connect this chat to your store, open the <b>Telegram</b> tab in your account settings and scan the QR code / tap the connect button.`
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('telegramWebhook error:', error);
    // Always 200 so Telegram doesn't retry-storm us.
    return Response.json({ ok: true });
  }
}