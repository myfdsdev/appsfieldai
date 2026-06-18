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

    return Response.json({ message: `Bid request ${statusLabels[status] || status}`, success: true });
  } catch (error) {
    console.error("notifyBidStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});