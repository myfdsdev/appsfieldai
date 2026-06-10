import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function notifyAdmins(base44, type, title, message, listingId, relatedRequestId) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        userId: admin.id,
        role: "admin",
        type,
        title,
        message,
        listingId: listingId || "",
        relatedRequestId: relatedRequestId || "",
        isRead: false,
      });
    }
  } catch (e) {
    console.error("notifyAdmins failed:", e);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userName, userEmail, listingTitle, requestType, listingId, requestId } = body;

    const typeLabel = requestType === "reserve_spot" ? "spot reservation" : "acquisition request";

    await notifyAdmins(
      base44,
      "request_cancelled",
      "Request Cancelled",
      `${userName || "A user"} cancelled their ${typeLabel} for "${listingTitle}".`,
      listingId || "",
      requestId || ""
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyAdminRequestCancelled error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});