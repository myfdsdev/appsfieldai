// Shared Telegram helper — sends messages through the store platform's Telegram bot.
// Used by notifyOwnerTelegram (agent alerts) and the telegramWebhook (connect confirmation).
import { secrets } from 'base44:runtime';

const API_BASE = 'https://api.telegram.org';

function botToken() {
  return secrets.get('TELEGRAM_BOT_TOKEN') || '';
}

// The bot's public username (needed to build the t.me deep link + QR code).
// Cached for the life of the isolate after the first lookup.
let cachedBotUsername = null;
export async function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const token = botToken();
  if (!token) return '';
  try {
    const res = await fetch(`${API_BASE}/bot${token}/getMe`);
    const data = await res.json();
    cachedBotUsername = data?.result?.username || '';
  } catch (_) {
    cachedBotUsername = '';
  }
  return cachedBotUsername;
}

// Registers the bot's webhook to point at our telegramWebhook function.
// Idempotent + cached — Telegram accepts re-setting the same URL cheaply, but we
// only actually call setWebhook once per isolate. Best-effort; never throws.
let webhookEnsured = false;
export async function ensureTelegramWebhook(appId) {
  if (webhookEnsured) return;
  const token = botToken();
  if (!token || !appId) return;
  try {
    const webhookUrl = `https://${appId}.base44.app/api/apps/${appId}/functions/telegramWebhook`;
    await fetch(`${API_BASE}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
    });
    webhookEnsured = true;
  } catch (_) { /* non-fatal */ }
}

// Send a Telegram message (HTML formatting) to a chat id. Best-effort — never throws.
export async function sendTelegramMessage(chatId, text) {
  const token = botToken();
  if (!token || !chatId || !text) return { ok: false };
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return await res.json();
  } catch (_) {
    return { ok: false };
  }
}