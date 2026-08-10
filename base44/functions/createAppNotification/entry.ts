import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getNotificationSettings, isChannelEnabled } from '../../shared/notificationSettings.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userId, role, type, title, message, listingId, relatedRequestId } = body;

    if (!userId || !type || !title || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Respect the admin-managed notification controls.
    const settings = await getNotificationSettings(base44);
    if (!isChannelEnabled(settings, type, "inApp")) {
      return Response.json({ success: true, skipped: true, reason: "disabled by notification settings" });
    }

    const notif = await base44.asServiceRole.entities.Notification.create({
      userId,
      role: role || "user",
      type,
      title,
      message,
      listingId: listingId || "",
      relatedRequestId: relatedRequestId || "",
      isRead: false,
    });

    return Response.json({ success: true, id: notif.id });
  } catch (error) {
    console.error("createAppNotification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});