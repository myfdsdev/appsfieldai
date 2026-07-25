import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import LeadRow from "./LeadRow";
import SendLeadEmailDialog from "./SendLeadEmailDialog";

export default function FindLeadsTab({ ownerId }) {
  const queryClient = useQueryClient();
  const [niche, setNiche] = useState("");
  const [area, setArea] = useState("");
  const [count, setCount] = useState(10);
  const [searching, setSearching] = useState(false);
  const [emailLead, setEmailLead] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["foundLeads", ownerId],
    queryFn: () => base44.entities.FoundLead.filter({ ownerId }, "-created_date", 100),
    enabled: !!ownerId,
  });

  const handleSearch = async () => {
    if (!niche.trim() || !area.trim()) { toast.error("Enter a niche and an area/city"); return; }
    setSearching(true);
    try {
      const r = await base44.functions.invoke("leadFinder", { action: "findLeads", niche, area, count: parseInt(count) || 10 });
      const data = r?.data || r;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
      toast.success(`Found ${data.leads?.length || 0} leads`);
    } catch (e) {
      toast.error(e.message || "Lead search failed");
    }
    setSearching(false);
  };

  const toggleShortlist = async (lead) => {
    await base44.entities.FoundLead.update(lead.id, { shortlisted: !lead.shortlisted });
    queryClient.invalidateQueries({ queryKey: ["foundLeads", ownerId] });
  };

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
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-orange-400" /> AI-researched leads with web context — best available, but verify details before contacting.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">No leads yet. Run a search above.</div>
      ) : (
        <div className="space-y-2.5">
          {leads.map((l) => (
            <LeadRow key={l.id} lead={l} onToggleShortlist={toggleShortlist} onSendEmail={setEmailLead} />
          ))}
        </div>
      )}

      <SendLeadEmailDialog open={!!emailLead} onClose={() => setEmailLead(null)} lead={emailLead} ownerId={ownerId} />
    </div>
  );
}