import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { userId, userEmail, userName, requestId, listingTitle, listingId, requestType, status, bidAmount } = body;

    if (!userId || !status || !requestId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const statusLabels = {
      approved: "approved",
      rejected: "rejected",
      contacted: "contacted",
    };

    // Update bid request status
    await base44.asServiceRole.entities.BidRequests.update(requestId, { status });

    // Create user notification
    const notifType = status === "approved" ? "request_approved" : status === "rejected" ? "request_rejected" : "request_contacted";
    const notifTitle = status === "approved" ? "Bid Approved" : status === "rejected" ? "Bid Rejected" : "Bid Contacted";
    const notifMsg = status === "approved"
      ? `Your bid of $${bidAmount?.toLocaleString()} on "${listingTitle}" has been approved. The admin will contact you.`
      : status === "rejected"
        ? `Your bid of $${bidAmount?.toLocaleString()} on "${listingTitle}" was not selected.`
        : `The admin would like to discuss your bid of $${bidAmount?.toLocaleString()} on "${listingTitle}".`;

    await base44.asServiceRole.entities.Notification.create({
      userId,
      role: "user",
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      listingId: listingId || "",
      relatedRequestId: requestId,
      isRead: false,
    });

    // Send email notification (logged automatically)
    if (userEmail) {
      const emailBody = status === "approved"
        ? `<p>Your bid of <strong>$${bidAmount?.toLocaleString()}</strong> on <strong>${listingTitle}</strong> has been <strong style="color:#34d399;">approved</strong>. The admin will contact you shortly.</p>`
        : status === "rejected"
        ? `<p>Your bid of <strong>$${bidAmount?.toLocaleString()}</strong> on <strong>${listingTitle}</strong> was not selected this time. Feel free to browse other listings.</p>`
        : `<p>The admin would like to discuss your bid of <strong>$${bidAmount?.toLocaleString()}</strong> on <strong>${listingTitle}</strong>. Please expect a call or email.</p>`;
      try {
        await base44.functions.invoke("sendEmail", {
          to: userEmail,
          subject: `Bid Update: ${listingTitle}`,
          body: `<div style="font-family:Arial,sans-serif;max-width:600px;padding:20px;background:#0a0a0a;color:#f0f0f0;border-radius:12px;"><h2 style="color:#f97316;">Bid Status Update</h2>${emailBody}<p style="color:#888;margin-top:24px;">— The SaaSShare Team</p></div>`,
          type: status === "approved" ? "request_approved_user" : status === "rejected" ? "request_rejected_user" : "request_contacted_user",
          relatedRequestId: requestId || "",
        });
      } catch (e) {
        console.error("Bid status email failed:", e.message);
      }
    }

    return Response.json({ message: `Bid request ${statusLabels[status] || status}`, success: true });
  } catch (error) {
    console.error("notifyBidStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});