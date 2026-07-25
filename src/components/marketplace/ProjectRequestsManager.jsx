import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FolderKanban, Mail, Phone, Send, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS = {
  new: { label: "New", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  started: { label: "Started", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  in_progress: { label: "In Progress", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  done: { label: "Done", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};
const STATUS_ORDER = ["new", "started", "in_progress", "done"];

// A single project request row — expandable to show requirements and manage status.
function RequestCard({ req, marketplaceId, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(req.status || "new");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const push = async (notifyClient) => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke("projectRequests", {
        action: "updateStatus",
        marketplaceId,
        requestId: req.id,
        status,
        note,
        notifyClient,
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(notifyClient ? (res.data?.emailed ? "Status updated & client notified" : "Status updated (no client email on file)") : "Status updated");
      setNote("");
      onUpdated?.();
    } catch (e) {
      toast.error(e.message || "Could not update status");
    } finally {
      setSaving(false);
    }
  };

  const s = STATUS[req.status] || STATUS.new;

  return (
    <div className="rounded-xl border border-border/40 bg-card/60">
      <div className="flex items-center justify-between gap-3 p-4 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{req.projectTitle || "Custom project"}</p>
          <p className="text-xs text-muted-foreground truncate">{req.clientName || "—"}{req.businessType ? ` · ${req.businessType}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${s.cls}`}>{s.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-4">
          {/* Client info */}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Client</p>
              <p className="font-medium">{req.clientName || "—"}</p>
              {req.clientEmail && <a href={`mailto:${req.clientEmail}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-xs mt-1"><Mail className="w-3.5 h-3.5" /> {req.clientEmail}</a>}
              {req.clientPhone && <span className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1"><Phone className="w-3.5 h-3.5" /> {req.clientPhone}</span>}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Requested</p>
              <p className="text-xs text-muted-foreground">{req.created_date ? format(new Date(req.created_date), "PPp") : "—"}</p>
              {req.lastStatusEmailAt && <p className="text-[11px] text-emerald-400 mt-1">Last notified {format(new Date(req.lastStatusEmailAt), "PP")}</p>}
            </div>
          </div>

          {/* Project requirement */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Project Requirement</p>
            {req.projectOverview && <p className="text-sm text-muted-foreground mb-2">{req.projectOverview}</p>}
            {req.painPoint && <p className="text-xs text-muted-foreground mb-2"><span className="font-medium text-foreground">Pain point:</span> {req.painPoint}</p>}
            {Array.isArray(req.features) && req.features.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {req.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>

          {req.statusNote && (
            <div className="rounded-lg bg-secondary/40 border border-border/30 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Last note sent</p>
              <p className="text-sm whitespace-pre-wrap">{req.statusNote}</p>
            </div>
          )}

          {/* Status management */}
          <div className="rounded-lg border border-border/30 p-3 space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((key) => (
                <button key={key} onClick={() => setStatus(key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${status === key ? STATUS[key].cls : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  {STATUS[key].label}
                </button>
              ))}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note to include in the client's update email…"
              className="bg-secondary/50 border-border/30 rounded-xl h-20 resize-none text-sm" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => push(true)} disabled={saving} size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Push Update to Client
              </Button>
              <Button onClick={() => push(false)} disabled={saving} size="sm" variant="outline" className="border-border/40 rounded-lg gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Save Only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lists project requests captured from the Deal Maker agent, lets the owner track
// requirements and push status updates (Started / In Progress / Done) to the client by email.
export default function ProjectRequestsManager({ marketplaceId }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    if (!marketplaceId) return;
    setLoading(true);
    base44.functions
      .invoke("projectRequests", { action: "list", marketplaceId })
      .then((res) => setRequests(res?.data?.requests || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [marketplaceId]); // eslint-disable-line

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading project requests…</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No project requests yet. When a visitor approves a custom plan with your Deal Maker agent, it appears here.</p>
      </div>
    );
  }

  const shown = filter === "all" ? requests : requests.filter((r) => (r.status || "new") === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${filter === "all" ? "bg-orange-500/15 text-orange-400 border-orange-500/20" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>All ({requests.length})</button>
        {STATUS_ORDER.map((key) => {
          const count = requests.filter((r) => (r.status || "new") === key).length;
          return (
            <button key={key} onClick={() => setFilter(key)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${filter === key ? STATUS[key].cls : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
              {STATUS[key].label} ({count})
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        {shown.map((req) => <RequestCard key={req.id} req={req} marketplaceId={marketplaceId} onUpdated={load} />)}
      </div>
    </div>
  );
}