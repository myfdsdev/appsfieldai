import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTelegramMessage, ensureBotCommands } from '../../shared/telegram.ts';
import { handleTelegramCommand, handleTelegramCallback, HELP_TEXT } from '../../shared/telegramCommands.ts';

// Telegram webhook — Telegram calls this whenever the bot receives a message.
// The only message we care about is the "/start <code>" the owner sends by
// tapping their personal deep link. We match <code> to a User (telegramConnectCode)
// and store that chat's id so agent alerts can reach them.
//
// This endpoint is called by Telegram with NO user auth, so it uses the service role.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const update = await req.json().catch(() => ({}));

    // Make sure the slash-command menu is registered (best-effort, cached).
    ensureBotCommands();

    // Inline button taps (e.g. one-tap order approval).
    if (update?.callback_query) {
      await handleTelegramCallback(svc, update.callback_query);
      return Response.json({ ok: true });
    }

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
      const users = await svc.entities.User.filter({ telegramConnectCode: code });
      const owner = users?.[0];
      if (owner) {
        const uname = chat.username ? `@${chat.username}` : (chat.first_name || '');
        await svc.entities.User.update(owner.id, {
          telegramChatId: String(chat.id),
          telegramUsername: uname,
        });
        await sendTelegramMessage(
          chat.id,
          `✅ <b>Connected!</b>\nYou'll now get instant alerts here whenever you get a new lead or a new sale. 🚀\n\n` +
          `Try these commands:\n/sales · /revenue · /leads · /pending · /approve`
        );
      } else {
        await sendTelegramMessage(
          chat.id,
          `Hmm, that connection link looks expired. Open the Telegram tab in your account settings and scan the QR code again.`
        );
      }
      return Response.json({ ok: true });
    }

    // Owner commands: /sales /revenue /leads /pending /approve /help
    const handled = await handleTelegramCommand(svc, chat.id, text);
    if (handled) {
      return Response.json({ ok: true });
    }

    // Bare /start — welcome + full command list.
    if (/^\/start$/.test(text)) {
      await sendTelegramMessage(
        chat.id,
        `👋 To connect this chat to your store, open the <b>Telegram</b> tab in your account settings and scan the QR code / tap the connect button.\n\n${HELP_TEXT}`
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('telegramWebhook error:', error);
    // Always 200 so Telegram doesn't retry-storm us.
    return Response.json({ ok: true });
  }
}