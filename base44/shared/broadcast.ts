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
  const appUrl = broadcast.appUrl || "https://appsfieldai.com";
  const mediaHtml =
    broadcast.mediaType === "image" && broadcast.mediaUrl
      ? `<img src="${broadcast.mediaUrl}" alt="" style="width:100%;border-radius:14px;margin:0 0 22px" />`
      : "";
  const btn = (href, label, primary) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 10px 0;padding:13px 26px;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;${
      primary
        ? "background:#f97316;color:#ffffff;"
        : "background:#ffffff;color:#111827;border:1px solid #e5e7eb;"
    }">${label}</a>`;

  const actions =
    (broadcast.linkUrl ? btn(broadcast.linkUrl, broadcast.buttonLabel || "Learn more", true) : "") +
    btn(appUrl, "Get access to AppsField AI", !broadcast.linkUrl);

  return `
  <div style="background:#f5f6f8;padding:32px 12px;font-family:Inter,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #eceef1">
      <div style="background:linear-gradient(135deg,#f97316,#b45309);padding:20px 28px">
        <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">AppsField AI · Announcement</p>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827">${broadcast.title}</h1>
        ${mediaHtml}
        <div style="font-size:15px;line-height:1.7;color:#4b5563;white-space:pre-line">${broadcast.message}</div>
        <div style="margin-top:26px">${actions}</div>
      </div>
      <div style="padding:18px 28px;background:#fafbfc;border-top:1px solid #eceef1">
        <p style="margin:0;font-size:12px;color:#9ca3af">You're receiving this because you have an AppsField AI account.<br /><a href="${appUrl}" style="color:#f97316;text-decoration:none">${appUrl}</a></p>
      </div>
    </div>
  </div>`;
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
    // Throttle: emails go out one at a time with a small delay so the provider
    // isn't hit with the whole batch at once.
    for (const u of recipients) {
      if (!u.email) continue;
      const ok = await sendMail(u.email, broadcast.title, html);
      if (ok) emailCount++;
      await new Promise((r) => setTimeout(r, 700));
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