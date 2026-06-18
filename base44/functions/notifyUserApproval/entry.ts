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
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      userEmail, userName, listingTitle, requestType, status,
      listingId, userId, phone, budget, offerAmount, message, notes,
      requestId,
    } = body;

    if (!userEmail) {
      console.log("No userEmail provided, skipping notification");
      return Response.json({ success: true });
    }

    const isReservation = requestType === "reserve_spot";
    const typeLabel = isReservation ? "Spot Reservation" : "Acquisition Request";
    const buyerNote = message || notes || "";

    let subject = "";
    let bodyHtml = "";
    let notifType = "";
    let notifTitle = "";
    let notifMsg = "";

    if (status === "approved") {
      subject = `Your ${typeLabel} has been Approved! ✅`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316;">🎉 Great news, ${userName || "there"}!</h2>
          <p>Your <strong>${typeLabel}</strong> for <strong style="color: #a78bfa;">${listingTitle}</strong> has been <strong style="color: #34d399;">approved</strong>.</p>
          <p>Our team will be reaching out to you shortly to proceed with the next steps.</p>
          <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
        </div>
      `;
      notifType = "request_approved";
      notifTitle = "Request Approved!";
      notifMsg = `Your ${typeLabel.toLowerCase()} for "${listingTitle}" has been approved.`;

      // --- Create Lead record for seller dashboard ---
      if (listingId && userId) {
        try {
          const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
          const listing = listings[0];
          if (listing && listing.ownerUserId) {
            await base44.asServiceRole.entities.Lead.create({
              buyerUserId: userId,
              buyerName: userName || "Unknown",
              buyerEmail: userEmail,
              buyerPhone: phone || "",
              sellerUserId: listing.ownerUserId,
              listingId,
              listingTitle: listingTitle || listing.title,
              requestType: requestType || "reserve_spot",
              offerAmount: budget || offerAmount || 0,
              message: buyerNote,
              status: "approved",
            });
            console.log(`Lead created for listing ${listingId}, buyer ${userId}`);
          }
        } catch (e) {
          console.error("Lead creation failed:", e);
        }
      }

      // --- Notify seller ---
      if (listingId) {
        try {
          const listings = await base44.asServiceRole.entities.SaaSListing.filter({ id: listingId });
          const listing = listings[0];
          if (listing && listing.ownerUserId) {
            const seller = await base44.asServiceRole.entities.User.get(listing.ownerUserId);
            if (seller && seller.email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: seller.email,
                subject: `New ${typeLabel} Lead for "${listingTitle || listing.title}"`,
                body: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
                    <h2 style="color: #f97316;">📩 New Lead Alert!</h2>
                    <p>A buyer has shown interest in your listing <strong style="color: #a78bfa;">${listingTitle || listing.title}</strong>.</p>
                    <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Buyer:</strong> ${userName || "Unknown"}</p>
                      <p style="margin: 4px 0;"><strong>Email:</strong> ${userEmail}</p>
                      ${phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${phone}</p>` : ""}
                      ${(budget || offerAmount) ? `<p style="margin: 4px 0;"><strong>Offer:</strong> $${(budget || offerAmount)?.toLocaleString()}</p>` : ""}
                      ${buyerNote ? `<p style="margin: 4px 0;"><strong>Message:</strong> ${buyerNote}</p>` : ""}
                    </div>
                    <p>The admin team has approved this lead. They will coordinate the next steps.</p>
                    <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
                  </div>
                `,
                isHtml: true,
              });
              console.log(`Seller notified at ${seller.email}`);
            }
          }
        } catch (e) {
          console.error("Seller notification failed:", e);
        }
      }

    } else if (status === "contacted") {
      subject = `We've reached out regarding your ${typeLabel}`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316;">Hello ${userName || "there"},</h2>
          <p>We have <strong style="color: #22d3ee;">contacted you</strong> regarding your <strong>${typeLabel}</strong> for <strong style="color: #a78bfa;">${listingTitle}</strong>.</p>
          <p>Please check your phone or email for further instructions from our team.</p>
          <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
        </div>
      `;
      notifType = "request_contacted";
      notifTitle = "Request Update";
      notifMsg = `You've been contacted regarding your ${typeLabel.toLowerCase()} for "${listingTitle}".`;

    } else if (status === "rejected") {
      subject = `Update on your ${typeLabel}`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316;">Hello ${userName || "there"},</h2>
          <p>Unfortunately, your <strong>${typeLabel}</strong> for <strong style="color: #a78bfa;">${listingTitle}</strong> could not be processed at this time.</p>
          <p>Feel free to browse other listings on our marketplace or reach out if you have any questions.</p>
          <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
        </div>
      `;
      notifType = "request_rejected";
      notifTitle = "Request Update";
      notifMsg = `Your ${typeLabel.toLowerCase()} for "${listingTitle}" was not accepted.`;

    } else if (status === "deal_in_progress") {
      subject = `Your ${typeLabel} deal is in progress! 🚀`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316;">Hello ${userName || "there"},</h2>
          <p>Great news! Your <strong>${typeLabel}</strong> for <strong style="color: #a78bfa;">${listingTitle}</strong> is now <strong style="color: #60a5fa;">in progress</strong>.</p>
          <p>The deal is actively being worked on. We'll keep you updated as things move forward.</p>
          <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
        </div>
      `;
      notifType = "request_in_progress";
      notifTitle = "Deal In Progress";
      notifMsg = `Your ${typeLabel.toLowerCase()} for "${listingTitle}" is now in progress.`;

    } else if (status === "deal_closed") {
      subject = `Your ${typeLabel} deal is closed! 🎊`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316;">Congratulations, ${userName || "there"}!</h2>
          <p>Your <strong>${typeLabel}</strong> for <strong style="color: #a78bfa;">${listingTitle}</strong> has been <strong style="color: #8b5cf6;">successfully closed</strong>.</p>
          <p>Thank you for using SaaSShare! We hope you enjoy your new investment.</p>
          <p style="margin-top: 24px; color: #888;">— The SaaSShare Team</p>
        </div>
      `;
      notifType = "deal_closed";
      notifTitle = "Deal Closed!";
      notifMsg = `Your ${typeLabel.toLowerCase()} for "${listingTitle}" has been successfully closed.`;
    }

    if (!subject) return Response.json({ success: true });

    // Send email via centralized sender (logs automatically)
    try {
      await base44.functions.invoke("sendEmail", {
        to: userEmail,
        subject,
        body: bodyHtml,
        type: status === "approved" ? "request_approved_user" : status === "rejected" ? "request_rejected_user" : "request_contacted_user",
        relatedRequestId: requestId || "",
      });
    } catch (e) {
      console.error("Email send failed:", e.message);
    }

    // Create in-app notification for the user
    if (notifType && userId) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          userId,
          role: "user",
          type: notifType,
          title: notifTitle,
          message: notifMsg,
          listingId: listingId || "",
          relatedRequestId: requestId || "",
          isRead: false,
        });
      } catch (e) {
        console.error("User notification creation failed:", e);
      }
    }

    console.log(`Sent ${status} notification to ${userEmail}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyUserApproval error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});