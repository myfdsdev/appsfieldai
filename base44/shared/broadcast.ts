// Shared delivery logic for admin announcements (broadcasts).

async function resolveRecipients(base44, audience: string) {
  const users = await base44.asServiceRole.entities.User.list();
  if (audience === "admins") return users.filter((u) => u.role === "admin");
  if (audience === "store_owners") {
    const stores = await base44.asServiceRole.entities.Marketplace.list();
    const ownerIds = new Set(stores.map((s) => s.ownerId));
    return users.filter((u) => ownerIds.has(u.id));
  }
  return users;
}

async function sendMail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "AppsField AI <info@appsfieldai.com>", to, subject, html }),
  });
  return res.ok;
}

function buildHtml(broadcast) {
  const mediaHtml =
    broadcast.mediaType === "image" && broadcast.mediaUrl
      ? `<p><img src="${broadcast.mediaUrl}" alt="" style="max-width:100%;border-radius:12px" /></p>`
      : "";
  const buttonHtml = broadcast.linkUrl
    ? `<p><a href="${broadcast.linkUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">${broadcast.buttonLabel || "Open"}</a></p>`
    : "";
  return `<div style="font-family:Inter,Arial,sans-serif"><h2>${broadcast.title}</h2>${mediaHtml}<p>${broadcast.message}</p>${buttonHtml}</div>`;
}

// Sends the announcement to a single user only (test send). Nothing is persisted
// beyond that user's own notification.
export async function deliverTest(base44, broadcast, user) {
  await base44.asServiceRole.entities.Notification.create({
    userId: user.id,
    role: user.role === "admin" ? "admin" : "user",
    type: "announcement",
    title: `[TEST] ${broadcast.title}`,
    message: broadcast.message,
    linkUrl: broadcast.linkUrl || "",
    isRead: false,
  });
  let emailed = false;
  if (broadcast.sendEmail && user.email) {
    emailed = await sendMail(user.email, `[TEST] ${broadcast.title}`, buildHtml(broadcast));
  }
  return { emailed };
}

export async function deliverBroadcast(base44, broadcast) {
  const recipients = await resolveRecipients(base44, broadcast.audience || "store_owners");

  const notifications = recipients.map((u) => ({
    userId: u.id,
    role: u.role === "admin" ? "admin" : "user",
    type: "announcement",
    title: broadcast.title,
    message: broadcast.message,
    linkUrl: broadcast.linkUrl || "",
    isRead: false,
  }));
  if (notifications.length) {
    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
  }

  let emailCount = 0;
  if (broadcast.sendEmail) {
    const html = buildHtml(broadcast);
    for (const u of recipients) {
      if (!u.email) continue;
      const ok = await sendMail(u.email, broadcast.title, html);
      if (ok) emailCount++;
    }
  }

  const hours = Number(broadcast.durationHours ?? 24);
  const expiresAt = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : "";

  await base44.asServiceRole.entities.AdminBroadcast.update(broadcast.id, {
    status: "sent",
    sentAt: new Date().toISOString(),
    recipientCount: recipients.length,
    emailCount,
    expiresAt,
  });

  return { recipientCount: recipients.length, emailCount };
}