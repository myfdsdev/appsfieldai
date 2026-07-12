import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Download, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const STATUS = {
  customer: { label: "Customer", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  potential_buyer: { label: "Potential Buyer", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  lead: { label: "Lead", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

// Aggregated leads captured across the Deal Maker, custom-build requests and
// checkout — each tagged with where it came from, its purpose and a status.
export default function DealMakerLeads({ marketplaceId }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!marketplaceId) return;
    let cancelled = false;
    setLoading(true);
    base44.functions
      .invoke("dealMakerReport", { action: "leads", marketplaceId })
      .then((res) => { if (!cancelled) setLeads(res?.data?.leads || []); })
      .catch(() => { if (!cancelled) setLeads([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [marketplaceId]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Name", "Email", "Contact No", "Website", "Status", "Source", "Purpose", "Date"];
    const rows = leads.map((l) => [
      l.name, l.email, l.phone, l.website,
      STATUS[l.status]?.label || l.status, l.source, l.purpose,
      l.date ? format(new Date(l.date), "yyyy-MM-dd HH:mm") : "",
    ].map(esc).join(","));
    const csv = [header.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leads…
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No leads captured yet. Visitors who chat, request a build, or check out will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{leads.length} lead{leads.length !== 1 ? "s" : ""} captured</p>
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
              <th className="text-left font-medium px-4 py-2.5">Contact No</th>
              <th className="text-left font-medium px-4 py-2.5">Website</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l, i) => {
              const s = STATUS[l.status] || STATUS.lead;
              return (
                <tr key={i} className="border-t border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{l.name || "—"}</td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> {l.email}
                      </a>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {l.phone ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5 shrink-0" /> {l.phone}</span>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {l.website ? (
                      <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="w-3.5 h-3.5 shrink-0" /> {l.website}
                      </a>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${s.cls}`}>{s.label}</span>
                    <span className="block text-[10px] text-muted-foreground/60 mt-1">{l.source}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px]">
                    <span className="line-clamp-2">{l.purpose || "—"}</span>
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