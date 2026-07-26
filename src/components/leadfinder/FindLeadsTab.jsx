import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Sparkles, MapPin, ChevronLeft, ChevronRight, Download, Mail, Phone, Globe, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REQUIRE_FIELDS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Contact number", icon: Phone },
  { id: "website", label: "Website", icon: Globe },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
];
import { toast } from "sonner";
import LeadRow from "./LeadRow";
import SendLeadEmailDialog from "./SendLeadEmailDialog";
import { exportLeadsCsv } from "./exportLeadsCsv";

const GROUPS_PER_PAGE = 3;

export default function FindLeadsTab({ ownerId }) {
  const queryClient = useQueryClient();
  const [niche, setNiche] = useState("");
  const [area, setArea] = useState("");
  const [count, setCount] = useState(10);
  const [require, setRequire] = useState({ email: true });
  const [searching, setSearching] = useState(false);

  const toggleRequire = (id) => setRequire((r) => ({ ...r, [id]: !r[id] }));
  const [emailLead, setEmailLead] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["foundLeads", ownerId],
    queryFn: () => base44.entities.FoundLead.filter({ ownerId }, "-created_date", 500),
    enabled: !!ownerId,
  });

  const handleSearch = async () => {
    if (!niche.trim() || !area.trim()) { toast.error("Enter a niche and an area/city"); return; }
    setSearching(true);
    try {
      const requireFields = Object.keys(require).filter((k) => require[k]);
      const r = await base44.functions.invoke("leadFinder", { action: "findLeads", niche, area, count: parseInt(count) || 10, requireFields });
      const data = r?.data || r;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
      toast.success(`Found ${data.leads?.length || 0} leads`);
      setPage(1);
    } catch (e) {
      toast.error(e.message || "Lead search failed");
    }
    setSearching(false);
  };

  const toggleShortlist = async (lead) => {
    await base44.entities.FoundLead.update(lead.id, { shortlisted: !lead.shortlisted });
    queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
  };

  const hasField = (l, f) => {
    if (f === "email") return (l.emails || []).some(Boolean);
    return !!(l[f] && String(l[f]).trim());
  };

  // Filter by selected "must have" fields + search, then group by search session (niche + area).
  const groups = useMemo(() => {
    const s = query.trim().toLowerCase();
    const activeReq = Object.keys(require).filter((k) => require[k]);
    let filtered = leads.filter((l) => activeReq.every((f) => hasField(l, f)));
    if (s) {
      filtered = filtered.filter((l) =>
        (l.businessName || "").toLowerCase().includes(s) ||
        (l.description || "").toLowerCase().includes(s) ||
        (l.emails || []).join(" ").toLowerCase().includes(s) ||
        (l.niche || "").toLowerCase().includes(s) ||
        (l.area || "").toLowerCase().includes(s)
      );
    }

    const map = new Map();
    for (const l of filtered) {
      const key = `${l.niche || "Leads"}||${l.area || ""}`;
      if (!map.has(key)) map.set(key, { niche: l.niche || "Leads", area: l.area || "", items: [] });
      map.get(key).items.push(l);
    }
    return Array.from(map.values());
  }, [leads, query, require]);

  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const pageGroups = groups.slice((page - 1) * GROUPS_PER_PAGE, page * GROUPS_PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-1"><Label className="text-xs">Niche / Business</Label><Input value={niche} onChange={(e) => setNiche(e.target.value)} className="mt-1" placeholder="e.g. gyms, dentists" /></div>
          <div className="sm:col-span-1"><Label className="text-xs">Area / City</Label><Input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1" placeholder="e.g. Austin, TX" /></div>
          <div className="sm:col-span-1"><Label className="text-xs">Number of Leads</Label><Input type="number" min={1} max={30} value={count} onChange={(e) => setCount(e.target.value)} className="mt-1" /></div>
          <Button onClick={handleSearch} disabled={searching} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find Leads
          </Button>
        </div>
        <div className="mt-4">
          <Label className="text-xs">Leads must have</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {REQUIRE_FIELDS.map((f) => {
              const active = !!require[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { toggleRequire(f.id); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-orange-500/15 border-orange-500/50 text-orange-400" : "border-border/50 text-muted-foreground hover:border-border"}`}
                >
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Only returns leads that have every selected field. Select all to force fully-contactable leads.</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-orange-400" /> AI-researched leads with web context — best available, but verify details before contacting.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">No leads yet. Run a search above.</div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-9" placeholder="Search found leads" />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={leads.length === 0}
              onClick={() => exportLeadsCsv(groups.flatMap((g) => g.items), "found-leads")}
              className="gap-1.5 border-border/40 shrink-0"
            >
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">No results match your search.</div>
          ) : (
            <div className="space-y-6">
              {pageGroups.map((g) => (
                <div key={`${g.niche}-${g.area}`} className="space-y-2.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                    <span className="text-sm font-display font-bold capitalize">{g.niche}</span>
                    {g.area && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {g.area}</span>}
                    <span className="ml-auto text-[11px] text-muted-foreground">{g.items.length} lead{g.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  {g.items.map((l) => (
                    <LeadRow key={l.id} lead={l} onToggleShortlist={toggleShortlist} onSendEmail={setEmailLead} />
                  ))}
                </div>
              ))}
            </div>
          )}

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
    </div>
  );
}