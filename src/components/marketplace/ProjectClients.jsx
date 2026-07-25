import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Download, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const STATUS = {
  new: { label: "New", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  started: { label: "Started", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  in_progress: { label: "In Progress", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  done: { label: "Done", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

// Client list — everyone who requested a new project through the Deal Maker,
// deduped by email, with an Export CSV option.
export default function ProjectClients({ marketplaceId }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!marketplaceId) return;
    setLoading(true);
    base44.functions
      .invoke("projectRequests", { action: "list", marketplaceId })
      .then((res) => {
        const requests = res?.data?.requests || [];
        // Dedupe by email (fall back to name), keeping the most recent request.
        const map = new Map();
        for (const r of requests) {
          const key = (r.clientEmail || "").trim().toLowerCase() || `name:${(r.clientName || "").trim().toLowerCase()}`;
          if (!key || key === "name:") continue;
          const prev = map.get(key);
          if (!prev || (r.created_date || "") > (prev.created_date || "")) {
            map.set(key, {
              clientName: r.clientName || prev?.clientName || "",
              clientEmail: r.clientEmail || prev?.clientEmail || "",
              clientPhone: r.clientPhone || prev?.clientPhone || "",
              businessType: r.businessType || prev?.businessType || "",
              projectTitle: r.projectTitle || "",
              status: r.status || "new",
              projectCount: (prev?.projectCount || 0) + 1,
              created_date: r.created_date || prev?.created_date || "",
            });
          } else {
            prev.projectCount = (prev.projectCount || 0) + 1;
          }
        }
        setClients([...map.values()].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")));
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [marketplaceId]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Name", "Email", "Phone", "Business", "Latest Project", "Status", "Projects", "First Requested"];
    const rows = clients.map((c) => [
      c.clientName, c.clientEmail, c.clientPhone, c.businessType, c.projectTitle,
      STATUS[c.status]?.label || c.status, c.projectCount,
      c.created_date ? format(new Date(c.created_date), "yyyy-MM-dd HH:mm") : "",
    ].map(esc).join(","));
    const csv = [header.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading clients…</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No project clients yet. Clients who request a new project through your Deal Maker will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        <Button onClick={exportCsv} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 text-muted-foreground text-xs">
              <th className="text-left font-medium px-4 py-2.5">Name</th>
              <th className="text-left font-medium px-4 py-2.5">Email</th>
              <th className="text-left font-medium px-4 py-2.5">Phone</th>
              <th className="text-left font-medium px-4 py-2.5">Business</th>
              <th className="text-left font-medium px-4 py-2.5">Latest Project</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => {
              const s = STATUS[c.status] || STATUS.new;
              return (
                <tr key={i} className="border-t border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{c.clientName || "—"}</td>
                  <td className="px-4 py-3">
                    {c.clientEmail ? (
                      <a href={`mailto:${c.clientEmail}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> {c.clientEmail}
                      </a>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.clientPhone ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5 shrink-0" /> {c.clientPhone}</span>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.businessType || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[220px]"><span className="line-clamp-1">{c.projectTitle || "—"}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${s.cls}`}>{s.label}</span>
                    {c.projectCount > 1 && <span className="block text-[10px] text-muted-foreground/60 mt-1">{c.projectCount} projects</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}