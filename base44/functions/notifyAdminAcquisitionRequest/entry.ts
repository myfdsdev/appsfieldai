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
    const { userName, userEmail, listingTitle, offerAmount, listingId, requestId } = body;

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";

    // Email notification
    if (adminEmail) {
      try {
        const offerText = offerAmount ? ` with an offer of $${offerAmount.toLocaleString()}` : "";
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `New Acquisition Request: ${listingTitle}`,
          body: `<p><strong>${userName || "A user"}</strong> (${userEmail}) wants to acquire <strong>${listingTitle}</strong>${offerText}.</p><p>Review it in the Admin Panel.</p>`,
          isHtml: true,
        });
      } catch (e) { console.error("Admin email failed:", e.message); }
    }

    // In-app notification for admins
    const offerMsg = offerAmount ? ` with an offer of $${offerAmount.toLocaleString()}` : "";
    await notifyAdmins(
      base44,
      "new_acquisition",
      "New Acquisition Request",
      `${userName || "A user"} wants to acquire "${listingTitle}"${offerMsg}`,
      listingId || "",
      requestId || ""
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyAdminAcquisitionRequest error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});