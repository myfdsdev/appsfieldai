import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId, messages } = await req.json();
    if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'conversationId and messages are required' }, { status: 400 });
    }

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content || ''}`)
      .join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are summarizing a support chat between a store owner (User) and the AppsField in-app support agent.\n\nWrite a short report for the platform admin with:\n1. What the user asked about (main topics).\n2. What guidance the agent gave.\n3. A clear CONCLUSION: was the issue resolved, partially resolved, or unresolved — and any follow-up the admin should take.\n\nKeep it under 150 words, plain text, no markdown headings.\n\nTRANSCRIPT:\n${transcript}`,
    });

    const conclusion = typeof result === 'string' ? result : JSON.stringify(result);

    const existing = await base44.asServiceRole.entities.SupportChatReport.filter({ conversationId });
    const payload = {
      conversationId,
      userId: user.id,
      userName: user.full_name || '',
      userEmail: user.email || '',
      conclusion,
      messageCount: messages.length,
      transcript,
    };

    let report;
    if (existing.length > 0) {
      report = await base44.asServiceRole.entities.SupportChatReport.update(existing[0].id, payload);
    } else {
      report = await base44.asServiceRole.entities.SupportChatReport.create(payload);
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}