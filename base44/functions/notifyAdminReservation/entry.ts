import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userName, userEmail, listingTitle } = body;

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";
    if (!adminEmail) {
      console.log("No ADMIN_EMAIL set, skipping notification");
      return Response.json({ success: true });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `New Spot Reservation: ${listingTitle}`,
      body: `<p><strong>${userName || "A user"}</strong> (${userEmail}) has reserved a spot for <strong>${listingTitle}</strong>.</p><p>Review it in the Admin Panel.</p>`,
      isHtml: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyAdminReservation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});