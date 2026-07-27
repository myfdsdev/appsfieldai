import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTelegramMessage } from '../../shared/telegram.ts';

// Sends an agent alert (new lead / new sale) to a store owner's connected Telegram.
// Called internally by other backend functions (dealMakerChat, storeCheckout, ...).
// Resolves the owner from a marketplaceId (preferred) or an explicit ownerId,
// and is a best-effort no-op when the owner hasn't connected Telegram.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { marketplaceId, ownerId, text } = await req.json();

    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    let resolvedOwnerId = ownerId;
    if (!resolvedOwnerId && marketplaceId) {
      const mkts = await svc.entities.Marketplace.filter({ id: marketplaceId });
      resolvedOwnerId = mkts?.[0]?.ownerId;
    }
    if (!resolvedOwnerId) {
      return Response.json({ ok: false, reason: 'no owner' });
    }

    const owners = await svc.entities.User.filter({ id: resolvedOwnerId });
    const owner = owners?.[0];
    if (!owner?.telegramChatId) {
      return Response.json({ ok: false, reason: 'not connected' });
    }

    const result = await sendTelegramMessage(owner.telegramChatId, text);
    return Response.json({ ok: !!result?.ok });
  } catch (error) {
    console.error('notifyOwnerTelegram error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}