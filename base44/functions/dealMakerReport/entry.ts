import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Deal Maker conversation logging + reporting.
//  - action "save": called by the store widget after each turn (no auth — public
//    store visitor). Upserts the conversation by sessionId, and periodically
//    extracts contact details + a conclusion via the AI engine.
//  - action "list": called by the store owner's dashboard (authed) to read the
//    conversation history / report for their store.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, marketplaceId } = body || {};
    if (!marketplaceId) {
      return Response.json({ error: 'marketplaceId is required' }, { status: 400 });
    }
    const svc = base44.asServiceRole;

    // ── Owner report: list this store's conversations (auth + ownership) ──
    if (action === 'list') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const mkts = await svc.entities.Marketplace.filter({ id: marketplaceId });
      const m = mkts?.[0];
      if (!m) return Response.json({ error: 'Store not found' }, { status: 404 });
      if (m.ownerId !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const conversations = await svc.entities.DealMakerConversation.filter(
        { marketplaceId }, '-updated_date', 200
      );
      return Response.json({ conversations });
    }

    // ── Owner leads: aggregate every captured lead across all sources ──
    //  Sources: Deal Maker conversations, custom-build requests (DealMakerLead)
    //  and store orders (checkout customers). Deduped by email, each tagged with
    //  a status (Customer / Potential Buyer / Lead) and a short purpose.
    if (action === 'leads') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const mkts = await svc.entities.Marketplace.filter({ id: marketplaceId });
      const m = mkts?.[0];
      if (!m) return Response.json({ error: 'Store not found' }, { status: 404 });
      if (m.ownerId !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const [conversations, dmLeads, orders] = await Promise.all([
        svc.entities.DealMakerConversation.filter({ marketplaceId }, '-updated_date', 500),
        svc.entities.DealMakerLead.filter({ marketplaceId }, '-created_date', 500),
        svc.entities.StoreOrder.filter({ marketplaceId }, '-created_date', 500),
      ]);

      // Merge into a keyed map so the strongest status wins per person.
      // Status rank: customer (3) > potential_buyer (2) > lead (1).
      const RANK = { customer: 3, potential_buyer: 2, lead: 1 };
      const map = new Map();
      const keyFor = (email, name) =>
        (email && email.trim().toLowerCase()) || `name:${(name || '').trim().toLowerCase()}` || null;

      const upsert = (entry) => {
        const key = keyFor(entry.email, entry.name);
        if (!key) return;
        const prev = map.get(key);
        if (!prev) { map.set(key, entry); return; }
        // Keep the higher-ranked status; fill any missing contact fields.
        const better = (RANK[entry.status] || 0) >= (RANK[prev.status] || 0);
        map.set(key, {
          name: prev.name || entry.name,
          email: prev.email || entry.email,
          phone: prev.phone || entry.phone,
          website: prev.website || entry.website,
          status: better ? entry.status : prev.status,
          source: better ? entry.source : prev.source,
          purpose: better ? entry.purpose : prev.purpose,
          date: prev.date > entry.date ? prev.date : entry.date,
        });
      };

      // 1) Store orders → Customer (successful transaction)
      for (const o of orders) {
        const paid = o.paymentStatus === 'paid' || o.status === 'completed';
        const items = Array.isArray(o.items) ? o.items.map((i) => i.listingTitle).filter(Boolean) : [];
        upsert({
          name: o.customerName || '',
          email: o.customerEmail || '',
          phone: o.phone || '',
          website: '',
          status: paid ? 'customer' : 'potential_buyer',
          source: 'Checkout',
          purpose: items.length ? `Purchased ${items.join(', ')}` : 'Started checkout',
          date: o.created_date || '',
        });
      }

      // 2) Custom-build requests / captured leads → Potential Buyer (hot) or Lead
      for (const l of dmLeads) {
        upsert({
          name: l.name || '',
          email: l.email || '',
          phone: l.phone || '',
          website: '',
          status: l.type === 'custom_request' ? 'potential_buyer' : 'lead',
          source: l.type === 'custom_request' ? 'Custom Request' : 'Deal Maker',
          purpose: (l.summary || l.painPoint || l.businessType || '').slice(0, 160),
          date: l.created_date || '',
        });
      }

      // 3) Deal Maker conversations → status by outcome
      for (const c of conversations) {
        let status = 'lead';
        if (c.outcome === 'purchase') status = 'customer';
        else if (c.outcome === 'custom_request') status = 'potential_buyer';
        upsert({
          name: c.visitorName || c.title || '',
          email: c.visitorEmail || '',
          phone: c.visitorPhone || '',
          website: c.visitorWebsite || '',
          status,
          source: 'Deal Maker',
          purpose: (c.conclusion || c.businessType || '').slice(0, 160),
          date: c.updated_date || c.created_date || '',
        });
      }

      const leads = [...map.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return Response.json({ leads });
    }

    // ── Public save/upsert from the store widget ──
    if (action === 'save') {
      const { sessionId, messages = [] } = body || {};
      if (!sessionId) return Response.json({ error: 'sessionId is required' }, { status: 400 });
      // Only log real conversations (at least one visitor message).
      const hasVisitor = messages.some((mm) => mm.role === 'user');
      if (!hasVisitor) return Response.json({ ok: true, skipped: true });

      const clean = messages
        .filter((mm) => mm && (mm.role === 'user' || mm.role === 'assistant') && mm.content)
        .map((mm) => ({ role: mm.role, content: String(mm.content).slice(0, 4000) }));

      const existing = await svc.entities.DealMakerConversation.filter({ marketplaceId, sessionId }, '-created_date', 1);
      const record = existing?.[0];

      // Extract structured details + a conclusion from the transcript. Run it
      // on the first save and then refresh every few turns so it stays cheap.
      let extracted = null;
      const shouldExtract = !record || (clean.length - (record.messageCount || 0)) >= 2;
      if (shouldExtract) {
        const transcript = clean.map((mm) => `${mm.role === 'user' ? 'Visitor' : 'Agent'}: ${mm.content}`).join('\n');
        try {
          const prompt = `You are analyzing a sales chat between a store's AI agent and a website visitor. Read the transcript and extract any real details the VISITOR shared about themselves, plus a short conclusion.

Return ONLY a compact JSON object (no markdown, no prose) with these keys:
{"visitorName":"first name or full name if given, else empty","visitorEmail":"email if given else empty","visitorPhone":"phone if given else empty","visitorWebsite":"website URL if given else empty","visitorStore":"their store/business name if given else empty","businessType":"the kind of business they run if mentioned else empty","outcome":"one of: ongoing, lead, custom_request, purchase, abandoned","conclusion":"2-3 sentence summary of what the visitor wanted, what was discussed, and the outcome / recommended follow-up for the store owner"}

Only fill a field if the visitor actually provided it — never invent values. Use empty string when unknown.

TRANSCRIPT:
${transcript}`;
          const genRes = await base44.functions.invoke('aiGenerate', { prompt });
          const raw = genRes?.data?.result || '';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
        } catch (e) { console.error('dealMakerReport extract failed:', e); }
      }

      const firstName = extracted?.visitorName?.trim();
      const title = firstName || record?.title || 'Anonymous visitor';

      const patch = {
        marketplaceId,
        sessionId,
        title,
        messages: clean,
        messageCount: clean.length,
        ...(extracted ? {
          visitorName: extracted.visitorName || record?.visitorName || '',
          visitorEmail: extracted.visitorEmail || record?.visitorEmail || '',
          visitorPhone: extracted.visitorPhone || record?.visitorPhone || '',
          visitorWebsite: extracted.visitorWebsite || record?.visitorWebsite || '',
          visitorStore: extracted.visitorStore || record?.visitorStore || '',
          businessType: extracted.businessType || record?.businessType || '',
          outcome: extracted.outcome || record?.outcome || 'ongoing',
          conclusion: extracted.conclusion || record?.conclusion || '',
        } : {}),
      };

      if (record) {
        await svc.entities.DealMakerConversation.update(record.id, patch);
        return Response.json({ ok: true, id: record.id });
      }
      const created = await svc.entities.DealMakerConversation.create(patch);
      return Response.json({ ok: true, id: created.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('dealMakerReport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});