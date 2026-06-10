import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userName, userEmail, listingTitle, offerAmount } = body;

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";
    if (!adminEmail) {
      console.log("No ADMIN_EMAIL set, skipping notification");
      return Response.json({ success: true });
    }

    const offerText = offerAmount ? ` with an offer of $${offerAmount.toLocaleString()}` : "";

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `New Acquisition Request: ${listingTitle}`,
      body: `<p><strong>${userName || "A user"}</strong> (${userEmail}) wants to acquire <strong>${listingTitle}</strong>${offerText}.</p><p>Review it in the Admin Panel.</p>`,
      isHtml: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyAdminAcquisitionRequest error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});