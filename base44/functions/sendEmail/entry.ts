import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Centralized email sender with automatic EmailLog creation
// Payload: { to, subject, body, type, relatedRequestId? }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { to, subject, body: emailBody, type, relatedRequestId } = body;

    if (!to || !subject || !emailBody || !type) {
      return Response.json({ error: "Missing required fields: to, subject, body, type" }, { status: 400 });
    }

    let status = "sent";
    let error = null;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject,
        body: emailBody,
      });
    } catch (e) {
      console.error(`sendEmail failed [${type}] to ${to}:`, e.message);
      status = "failed";
      error = e.message;
    }

    // Always log the attempt
    try {
      await base44.asServiceRole.entities.EmailLog.create({
        to,
        subject,
        type,
        status,
        relatedRequestId: relatedRequestId || "",
        sentAt: new Date().toISOString(),
        error: error || "",
      });
    } catch (logErr) {
      console.error("EmailLog creation failed:", logErr.message);
    }

    if (status === "failed") {
      return Response.json({ success: false, error }, { status: 200 }); // 200 so caller doesn't crash
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("sendEmail error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});