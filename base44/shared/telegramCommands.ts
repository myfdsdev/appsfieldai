// Telegram bot command handlers for store owners.
// Owners connect their Telegram (via telegramConnect), then chat these commands:
//   /sales /revenue /leads /pending /approve /help
// Everything runs with the service role and is scoped to the marketplaces the
// connected owner owns.
import { sendTelegramMessage, answerCallbackQuery } from './telegram.ts';

function money(n, currency = 'USD') {
  return `${currency} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Find the connected owner (User) for a given Telegram chat id.
async function findOwner(svc, chatId) {
  const users = await svc.entities.User.filter({ telegramChatId: String(chatId) });
  return users?.[0] || null;
}

// All marketplaces owned by this user.
async function ownerMarketplaces(svc, ownerId) {
  return await svc.entities.Marketplace.filter({ ownerId });
}

// All store orders across the owner's marketplaces (newest first).
async function ownerOrders(svc, marketplaces) {
  const all = [];
  for (const mp of marketplaces) {
    const orders = await svc.entities.StoreOrder.filter({ marketplaceId: mp.id }, '-created_date');
    orders.forEach((o) => all.push({ ...o, _mpName: mp.name, _currency: mp.currency || 'USD' }));
  }
  all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return all;
}

export const HELP_TEXT =
  `🤖 <b>Your store commands</b>\n\n` +
  `/mystores — your running stores\n` +
  `/myagents — your store sales agents\n` +
  `/report — an agent's performance report\n` +
  `/orders — order requests awaiting approval\n` +
  `/sales — today & all-time sales\n` +
  `/revenue — revenue breakdown\n` +
  `/leads — your latest new leads\n` +
  `/pending — orders awaiting approval\n` +
  `/approve — approve a pending order\n` +
  `/help — show this menu`;

// Deal Maker agent display name for a marketplace (falls back to a default).
function agentName(mp) {
  return mp?.pageSections?.dealMakerName || 'Deal Maker';
}

// ─── /mystores — running store names ──────────────────────
async function cmdMyStores(svc, chatId, marketplaces) {
  const active = marketplaces.filter((m) => m.status === 'active');
  const others = marketplaces.filter((m) => m.status !== 'active');

  let text = `🏪 <b>Your stores (${marketplaces.length})</b>\n`;
  if (active.length) {
    text += `\n<b>🟢 Running:</b>`;
    for (const mp of active) text += `\n• ${mp.name}`;
  }
  if (others.length) {
    text += `\n\n<b>⚪ Not live:</b>`;
    for (const mp of others) text += `\n• ${mp.name} (${mp.status || 'draft'})`;
  }
  await sendTelegramMessage(chatId, text);
}

// ─── /myagents — store sales agents ───────────────────────
async function cmdMyAgents(svc, chatId, marketplaces) {
  await sendTelegramMessage(chatId, `🤝 <b>Your sales agents (${marketplaces.length})</b>\n<i>Tap Full report on any agent for its latest activity.</i>`);
  // One message per agent with a "Full report" button.
  for (const mp of marketplaces) {
    const enabled = mp?.pageSections?.dealMakerEnabled !== false;
    let text = `<b>${agentName(mp)}</b> ${enabled ? '🟢' : '⚪'}\n🏪 ${mp.name}`;
    if (mp?.pageSections?.dealMakerTagline) text += `\n💬 ${mp.pageSections.dealMakerTagline}`;
    await sendTelegramMessage(chatId, text, {
      inline_keyboard: [[{ text: '📋 Full report', callback_data: `report:${mp.id}` }]],
    });
  }
}

// Build a detailed activity report for one agent/store: last 5 conversations,
// recent orders, and recent project requests.
async function buildAgentReport(svc, mp) {
  const currency = mp.currency || 'USD';
  const convos = await svc.entities.DealMakerConversation.filter({ marketplaceId: mp.id }, '-created_date', 5);
  const orders = await svc.entities.StoreOrder.filter({ marketplaceId: mp.id }, '-created_date', 5);
  const projects = await svc.entities.ProjectRequest.filter({ marketplaceId: mp.id }, '-created_date', 5);

  let text = `📋 <b>${agentName(mp)} — full report</b>\n🏪 ${mp.name}\n`;

  text += `\n<b>💬 Last conversations</b>`;
  if (convos.length === 0) {
    text += `\n— none yet`;
  } else {
    for (const c of convos) {
      const who = c.visitorName || c.title || 'Anonymous';
      const outcome = c.outcome && c.outcome !== 'ongoing' ? ` · ${c.outcome.replace('_', ' ')}` : '';
      text += `\n• <b>${who}</b> (${c.messageCount || 0} msgs${outcome})`;
      if (c.visitorEmail) text += `\n   ✉️ ${c.visitorEmail}`;
      if (c.conclusion) text += `\n   📝 ${c.conclusion.slice(0, 120)}`;
    }
  }

  text += `\n\n<b>🛒 Recent orders</b>`;
  if (orders.length === 0) {
    text += `\n— none yet`;
  } else {
    for (const o of orders) {
      const items = (o.items || []).map((li) => `${li.quantity}× ${li.listingTitle}`).join(', ') || '—';
      text += `\n• ${o.customerName || o.customerEmail || 'Customer'} — ${money(o.total, currency)} (${o.paymentStatus})\n   ${items}`;
    }
  }

  text += `\n\n<b>🧩 Project requests</b>`;
  if (projects.length === 0) {
    text += `\n— none yet`;
  } else {
    for (const p of projects) {
      text += `\n• ${p.projectTitle || 'Custom project'} — ${p.clientName || 'Client'} (${p.status || 'new'})`;
      if (p.painPoint) text += `\n   💬 ${p.painPoint.slice(0, 100)}`;
    }
  }

  return text;
}

// ─── /report <agent name> — agent performance report ──────
async function cmdReport(svc, chatId, marketplaces, arg) {
  const query = (arg || '').trim().toLowerCase();

  if (!query) {
    let text = `📈 <b>Which agent?</b>\nSend <code>/report Agent Name</code>. Your agents:\n`;
    for (const mp of marketplaces) text += `\n• ${agentName(mp)} — ${mp.name}`;
    await sendTelegramMessage(chatId, text);
    return;
  }

  // Match on agent name or store name.
  const mp = marketplaces.find(
    (m) => agentName(m).toLowerCase() === query || m.name.toLowerCase() === query
  ) || marketplaces.find(
    (m) => agentName(m).toLowerCase().includes(query) || m.name.toLowerCase().includes(query)
  );

  if (!mp) {
    await sendTelegramMessage(chatId, `🤔 No agent named "<b>${arg.trim()}</b>". Try /myagents to see the list.`);
    return;
  }

  await sendTelegramMessage(chatId, await buildAgentReport(svc, mp));
}

// ─── /orders — order requests awaiting approval ───────────
async function cmdOrders(svc, chatId, marketplaces) {
  // Alias of /pending — shows tappable Approve buttons.
  await cmdPending(svc, chatId, marketplaces);
}

// ─── /sales ───────────────────────────────────────────────
async function cmdSales(svc, chatId, marketplaces) {
  const orders = await ownerOrders(svc, marketplaces);
  const paid = orders.filter((o) => o.paymentStatus === 'paid');
  const today = startOfToday();
  const paidToday = paid.filter((o) => new Date(o.paidAt || o.created_date) >= today);
  const currency = marketplaces[0]?.currency || 'USD';

  const todayRevenue = paidToday.reduce((s, o) => s + (o.total || 0), 0);
  const allRevenue = paid.reduce((s, o) => s + (o.total || 0), 0);

  const text =
    `📊 <b>Sales summary</b>\n\n` +
    `<b>Today:</b> ${paidToday.length} sale(s) · ${money(todayRevenue, currency)}\n` +
    `<b>All-time:</b> ${paid.length} sale(s) · ${money(allRevenue, currency)}\n` +
    `<b>Total orders:</b> ${orders.length}`;
  await sendTelegramMessage(chatId, text);
}

// ─── /revenue ─────────────────────────────────────────────
async function cmdRevenue(svc, chatId, marketplaces) {
  const orders = await ownerOrders(svc, marketplaces);
  const paid = orders.filter((o) => o.paymentStatus === 'paid');
  const pending = orders.filter((o) => o.paymentStatus === 'pending');
  const refunded = orders.filter((o) => o.paymentStatus === 'refunded');
  const currency = marketplaces[0]?.currency || 'USD';

  const paidTotal = paid.reduce((s, o) => s + (o.total || 0), 0);
  const pendingTotal = pending.reduce((s, o) => s + (o.total || 0), 0);
  const refundedTotal = refunded.reduce((s, o) => s + (o.total || 0), 0);

  let text = `💰 <b>Revenue</b>\n\n` +
    `<b>Collected (paid):</b> ${money(paidTotal, currency)}\n` +
    `<b>Awaiting approval:</b> ${money(pendingTotal, currency)} (${pending.length})\n` +
    `<b>Refunded:</b> ${money(refundedTotal, currency)} (${refunded.length})`;

  if (marketplaces.length > 1) {
    text += `\n\n<b>By store:</b>`;
    for (const mp of marketplaces) {
      const mpPaid = paid.filter((o) => o.marketplaceId === mp.id).reduce((s, o) => s + (o.total || 0), 0);
      text += `\n• ${mp.name}: ${money(mpPaid, mp.currency || 'USD')}`;
    }
  }
  await sendTelegramMessage(chatId, text);
}

// ─── /leads ───────────────────────────────────────────────
async function cmdLeads(svc, chatId, marketplaces) {
  const all = [];
  for (const mp of marketplaces) {
    const leads = await svc.entities.DealMakerLead.filter({ marketplaceId: mp.id, status: 'new' }, '-created_date', 10);
    leads.forEach((l) => all.push({ ...l, _mpName: mp.name }));
  }
  all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const recent = all.slice(0, 8);

  if (recent.length === 0) {
    await sendTelegramMessage(chatId, `🌱 <b>No new leads right now.</b>\nYou're all caught up!`);
    return;
  }

  let text = `🌱 <b>New leads (${all.length})</b>\n`;
  for (const l of recent) {
    const tag = l.type === 'custom_request' ? '🔥 Custom request' : 'Lead';
    text += `\n<b>${tag}</b> — ${l.name || 'Anonymous'}\n`;
    if (l.email) text += `✉️ ${l.email}\n`;
    if (l.phone) text += `📞 ${l.phone}\n`;
    if (l.businessType) text += `🏢 ${l.businessType}\n`;
    if (l.painPoint) text += `💬 ${l.painPoint.slice(0, 120)}\n`;
  }
  await sendTelegramMessage(chatId, text);
}

// ─── /pending ─────────────────────────────────────────────
async function cmdPending(svc, chatId, marketplaces) {
  const orders = await ownerOrders(svc, marketplaces);
  const pending = orders.filter((o) => o.paymentStatus === 'pending').slice(0, 8);

  if (pending.length === 0) {
    await sendTelegramMessage(chatId, `✅ <b>No pending orders.</b>\nEverything's approved!`);
    return;
  }

  await sendTelegramMessage(chatId, `⏳ <b>${pending.length} pending order(s)</b> — tap Approve to confirm payment:`);
  // One message per order with an inline "Approve" button so it's one tap.
  for (const o of pending) {
    const itemsSummary = (o.items || []).map((li) => `${li.quantity}× ${li.listingTitle}`).join(', ') || '—';
    const text =
      `🧾 <b>${o.customerName || o.customerEmail || 'Customer'}</b>\n` +
      `${money(o.total, o._currency)} · ${o.paymentMethod === 'paypal' ? 'PayPal' : 'Manual / COD'}\n` +
      `${itemsSummary}\n` +
      `<i>${new Date(o.created_date).toLocaleString()}</i>`;
    await sendTelegramMessage(chatId, text, {
      inline_keyboard: [[{ text: '✅ Approve payment', callback_data: `approve:${o.id}` }]],
    });
  }
}

// ─── /approve (no id — list what can be approved) ─────────
async function cmdApprove(svc, chatId, marketplaces, arg) {
  if (!arg) {
    // Reuse /pending so the owner gets tappable Approve buttons.
    await cmdPending(svc, chatId, marketplaces);
    return;
  }
  await approveOrder(svc, chatId, marketplaces, arg.trim());
}

// Approve a single order by id — used by /approve <id> and the inline button.
async function approveOrder(svc, chatId, marketplaces, orderId) {
  const mpIds = new Set(marketplaces.map((m) => m.id));
  const matches = await svc.entities.StoreOrder.filter({ id: orderId });
  const order = matches?.[0];
  if (!order || !mpIds.has(order.marketplaceId)) {
    return { ok: false, message: 'Order not found.' };
  }
  if (order.paymentStatus === 'paid') {
    return { ok: false, message: 'Order is already approved.' };
  }

  const updated = await svc.entities.StoreOrder.update(order.id, {
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
  });

  // Mirror the dashboard behaviour: email the customer their order is confirmed.
  if (updated?.customerEmail) {
    try {
      await svc.functions.invoke('sendStoreEmail', {
        marketplaceId: order.marketplaceId,
        templateKey: 'orderConfirmation',
        to: updated.customerEmail,
        order: updated,
        vars: {
          customer_name: updated.customerName || 'there',
          order_id: updated.id,
          order_total: `${updated.currency || 'USD'} ${(updated.total || 0).toLocaleString()}`,
        },
      });
    } catch (_) { /* non-fatal */ }
  }

  const currency = order.currency || 'USD';
  return { ok: true, message: `✅ Approved ${money(order.total, currency)} order for ${order.customerName || order.customerEmail || 'customer'}.` };
}

// Route a text command. Returns true if it was a recognized command.
export async function handleTelegramCommand(svc, chatId, text) {
  const m = text.match(/^\/(mystores|myagents|report|orders|sales|revenue|leads|pending|approve|help)\b\s*(.*)$/i);
  if (!m) return false;
  const cmd = m[1].toLowerCase();
  const arg = m[2] || '';

  if (cmd === 'help') {
    await sendTelegramMessage(chatId, HELP_TEXT);
    return true;
  }

  const owner = await findOwner(svc, chatId);
  if (!owner) {
    await sendTelegramMessage(chatId, `⚠️ This chat isn't linked to a store yet. Open the <b>Telegram</b> tab in your account settings and scan the QR code to connect.`);
    return true;
  }
  const marketplaces = await ownerMarketplaces(svc, owner.id);
  if (marketplaces.length === 0) {
    await sendTelegramMessage(chatId, `You don't have any stores yet. Create one in your dashboard first.`);
    return true;
  }

  if (cmd === 'mystores') await cmdMyStores(svc, chatId, marketplaces);
  else if (cmd === 'myagents') await cmdMyAgents(svc, chatId, marketplaces);
  else if (cmd === 'report') await cmdReport(svc, chatId, marketplaces, arg);
  else if (cmd === 'orders') await cmdOrders(svc, chatId, marketplaces);
  else if (cmd === 'sales') await cmdSales(svc, chatId, marketplaces);
  else if (cmd === 'revenue') await cmdRevenue(svc, chatId, marketplaces);
  else if (cmd === 'leads') await cmdLeads(svc, chatId, marketplaces);
  else if (cmd === 'pending') await cmdPending(svc, chatId, marketplaces);
  else if (cmd === 'approve') await cmdApprove(svc, chatId, marketplaces, arg);
  return true;
}

// Handle an inline-button tap (currently only "approve:<orderId>").
export async function handleTelegramCallback(svc, callback) {
  const chatId = callback?.message?.chat?.id;
  const data = callback?.data || '';
  const cbId = callback?.id;

  if (!chatId) {
    await answerCallbackQuery(cbId, '');
    return;
  }

  const owner = await findOwner(svc, chatId);
  if (!owner) {
    await answerCallbackQuery(cbId, 'This chat is not linked to a store.');
    return;
  }
  const marketplaces = await ownerMarketplaces(svc, owner.id);

  // "Full report" button — show this agent's latest activity.
  const reportMatch = data.match(/^report:(\S+)$/);
  if (reportMatch) {
    const mp = marketplaces.find((m) => m.id === reportMatch[1]);
    await answerCallbackQuery(cbId, mp ? 'Loading report…' : 'Store not found.');
    if (mp) await sendTelegramMessage(chatId, await buildAgentReport(svc, mp));
    return;
  }

  const approveMatch = data.match(/^approve:(\S+)$/);
  if (!approveMatch) {
    await answerCallbackQuery(cbId, '');
    return;
  }
  const result = await approveOrder(svc, chatId, marketplaces, approveMatch[1]);
  await answerCallbackQuery(cbId, result.ok ? 'Approved ✅' : result.message);
  await sendTelegramMessage(chatId, result.message);
}