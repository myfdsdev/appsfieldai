import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import moment from "moment";

const PER_PAGE = 15;

export default function EmailHistoryTab({ ownerId }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["leadEmails", ownerId],
    queryFn: () => base44.entities.LeadEmail.filter({ ownerId }, "-sentAt", 500),
    enabled: !!ownerId,
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return emails;
    return emails.filter((e) =>
      (e.businessName || "").toLowerCase().includes(s) ||
      (e.toEmail || "").toLowerCase().includes(s) ||
      (e.subject || "").toLowerCase().includes(s)
    );
  }, [emails, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (isLoading) return <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" placeholder="Search by business, email or subject" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" /> {emails.length === 0 ? "No emails sent yet." : "No results match your search."}
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {pageItems.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/40 bg-card/40 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{e.businessName || e.toEmail}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{e.sentAt ? moment(e.sentAt).format("MMM D, YYYY h:mm A") : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">To: {e.toEmail}</p>
                  {e.subject && <p className="text-xs mt-0.5 truncate">{e.subject}</p>}
                </div>
              </div>
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
    </div>
  );
}