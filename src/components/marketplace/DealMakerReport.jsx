import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageSquare, Mail, Phone, Globe, Store, User, Clock, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";

const OUTCOME_STYLES = {
  ongoing: "bg-blue-500/10 text-blue-400",
  lead: "bg-emerald-500/10 text-emerald-400",
  custom_request: "bg-amber-500/10 text-amber-400",
  purchase: "bg-violet-500/10 text-violet-400",
  abandoned: "bg-muted text-muted-foreground",
};
const OUTCOME_LABELS = {
  ongoing: "Ongoing",
  lead: "Lead",
  custom_request: "Custom Request",
  purchase: "Purchase",
  abandoned: "Abandoned",
};

// Owner-facing report of every Deal Maker conversation on the store —
// each entry shows the captured details (name, email, phone, website, store),
// the AI conclusion, and the full transcript on click.
export default function DealMakerReport({ marketplaceId }) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!marketplaceId) return;
    let cancelled = false;
    setLoading(true);
    base44.functions
      .invoke("dealMakerReport", { action: "list", marketplaceId })
      .then((res) => { if (!cancelled) setConversations(res?.data?.conversations || []); })
      .catch(() => { if (!cancelled) setConversations([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [marketplaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading conversations…
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No conversations yet. When visitors chat with your Deal Maker, they'll show up here with a summary and their details.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Conversation list */}
      <div className="space-y-2.5">
        {conversations.map((c) => {
          const isActive = active?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                isActive ? "border-primary bg-primary/10" : "border-border/40 bg-card/60 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title || "Anonymous visitor"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.updated_date ? format(new Date(c.updated_date), "MMM d, h:mm a") : "—"}
                      <span className="opacity-50">·</span>
                      {c.messageCount || c.messages?.length || 0} msgs
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${OUTCOME_STYLES[c.outcome] || OUTCOME_STYLES.ongoing}`}>
                  {OUTCOME_LABELS[c.outcome] || "Ongoing"}
                </span>
              </div>
              {c.conclusion && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.conclusion}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="md:sticky md:top-4 self-start">
        {active ? (
          <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-display font-bold">{active.title || "Anonymous visitor"}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${OUTCOME_STYLES[active.outcome] || OUTCOME_STYLES.ongoing}`}>
                {OUTCOME_LABELS[active.outcome] || "Ongoing"}
              </span>
            </div>

            {/* Captured details */}
            <div className="space-y-1.5">
              {active.visitorEmail && <DetailRow icon={Mail} label={active.visitorEmail} href={`mailto:${active.visitorEmail}`} />}
              {active.visitorPhone && <DetailRow icon={Phone} label={active.visitorPhone} />}
              {active.visitorWebsite && <DetailRow icon={Globe} label={active.visitorWebsite} href={active.visitorWebsite.startsWith("http") ? active.visitorWebsite : `https://${active.visitorWebsite}`} />}
              {active.visitorStore && <DetailRow icon={Store} label={active.visitorStore} />}
              {active.businessType && <DetailRow icon={User} label={active.businessType} />}
              {!active.visitorEmail && !active.visitorPhone && !active.visitorWebsite && !active.visitorStore && !active.businessType && (
                <p className="text-[11px] text-muted-foreground italic">No contact details captured.</p>
              )}
            </div>

            {/* Conclusion */}
            {active.conclusion && (
              <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3" /> Conclusion
                </p>
                <p className="text-xs leading-relaxed">{active.conclusion}</p>
              </div>
            )}

            {/* Transcript */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transcript</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(active.messages || []).map((mm, i) => (
                  <div key={i} className={`flex ${mm.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] text-xs rounded-lg px-3 py-2 ${
                      mm.role === "user" ? "bg-primary/15 text-foreground" : "bg-secondary/50 text-foreground"
                    }`}>
                      {mm.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/40 p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px]">
            <ChevronRight className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-sm">Select a conversation to see the details and transcript.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, href }) {
  const content = (
    <span className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:text-primary transition-colors">{content}</a>
  ) : (
    <div>{content}</div>
  );
}