import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userEmail, userName, listingTitle, requestType, status } = body;

    if (!userEmail) {
      console.log("No userEmail provided, skipping notification");
      return Response.json({ success: true });
    }

    const isReservation = requestType === "reserve_spot";
    const typeLabel = isReservation ? "Spot Reservation" : "Acquisition Request";

    let subject = "";
    let bodyHtml = "";

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
    }

    if (!subject) return Response.json({ success: true });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject,
      body: bodyHtml,
      isHtml: true,
    });

    console.log(`Sent ${status} notification to ${userEmail}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyUserApproval error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});