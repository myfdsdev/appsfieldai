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

    // ═══ SECURITY: Authenticated users only ═══
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userName, userEmail, listingTitle, offerAmount, listingId, requestId } = body;

    // Validate required fields
    if (!requestId || !listingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the acquisition request actually exists and belongs to current user
    const requests = await base44.asServiceRole.entities.AcquisitionRequests.filter({ id: requestId });
    if (!requests.length) {
      return Response.json({ error: 'Acquisition request not found' }, { status: 404 });
    }

    const request = requests[0];
    if (request.userId !== user.id) {
      return Response.json({ error: 'Forbidden — you can only notify for your own requests' }, { status: 403 });
    }

    // Verify the listing exists
    const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
    if (!listings.length) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";

    // Email notification via centralized sender (logs automatically)
    if (adminEmail) {
      try {
        const offerText = offerAmount ? ` with an offer of $${offerAmount.toLocaleString()}` : "";
        await base44.functions.invoke("sendEmail", {
          to: adminEmail,
          subject: `New Acquisition Request: ${listingTitle}`,
          body: `<p><strong>${userName || "A user"}</strong> (${userEmail}) wants to acquire <strong>${listingTitle}</strong>${offerText}.</p><p>Review it in the Admin Panel.</p>`,
          type: "acquisition_request_admin",
          relatedRequestId: requestId || "",
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