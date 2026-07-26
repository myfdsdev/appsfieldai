import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Plus, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LeadRow from "./LeadRow";
import SendLeadEmailDialog from "./SendLeadEmailDialog";
import AddLeadDialog from "./AddLeadDialog";
import { exportLeadsCsv } from "./exportLeadsCsv";

const PER_PAGE = 12;

export default function ShortlistTab({ ownerId }) {
  const queryClient = useQueryClient();
  const [emailLead, setEmailLead] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["foundLeads", ownerId],
    queryFn: () => base44.entities.FoundLead.filter({ ownerId }, "-created_date", 500),
    enabled: !!ownerId,
  });

  const shortlisted = useMemo(() => {
    const list = leads.filter((l) => l.shortlisted);
    const s = query.trim().toLowerCase();
    if (!s) return list;
    return list.filter((l) =>
      (l.businessName || "").toLowerCase().includes(s) ||
      (l.description || "").toLowerCase().includes(s) ||
      (l.emails || []).join(" ").toLowerCase().includes(s) ||
      (l.niche || "").toLowerCase().includes(s) ||
      (l.area || "").toLowerCase().includes(s)
    );
  }, [leads, query]);

  const totalPages = Math.max(1, Math.ceil(shortlisted.length / PER_PAGE));
  const pageItems = shortlisted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleShortlist = async (lead) => {
    await base44.entities.FoundLead.update(lead.id, { shortlisted: !lead.shortlisted });
    queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
  };

  if (isLoading) return <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {shortlisted.length} shortlisted lead{shortlisted.length !== 1 ? "s" : ""} ready to contact.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={shortlisted.length === 0} onClick={() => exportLeadsCsv(shortlisted, "shortlisted-leads")} className="gap-1.5 border-border/40">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add lead
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-9" placeholder="Search shortlisted leads" />
      </div>

      {shortlisted.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" /> {query ? "No results match your search." : "No shortlisted leads yet. Tap the star on any lead, or add one manually."}
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {pageItems.map((l) => (
              <LeadRow key={l.id} lead={l} onToggleShortlist={toggleShortlist} onSendEmail={setEmailLead} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}

      <SendLeadEmailDialog open={!!emailLead} onClose={() => setEmailLead(null)} lead={emailLead} ownerId={ownerId} />
      <AddLeadDialog open={addOpen} onClose={() => setAddOpen(false)} ownerId={ownerId} />
    </div>
  );
}