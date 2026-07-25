import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadRow from "./LeadRow";
import SendLeadEmailDialog from "./SendLeadEmailDialog";
import AddLeadDialog from "./AddLeadDialog";

export default function ShortlistTab({ ownerId }) {
  const queryClient = useQueryClient();
  const [emailLead, setEmailLead] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["foundLeads", ownerId],
    queryFn: () => base44.entities.FoundLead.filter({ ownerId }, "-created_date", 100),
    enabled: !!ownerId,
  });

  const shortlisted = leads.filter((l) => l.shortlisted);

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
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add lead
        </Button>
      </div>

      {shortlisted.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" /> No shortlisted leads yet. Tap the star on any lead, or add one manually.
        </div>
      ) : (
        <div className="space-y-2.5">
          {shortlisted.map((l) => (
            <LeadRow key={l.id} lead={l} onToggleShortlist={toggleShortlist} onSendEmail={setEmailLead} />
          ))}
        </div>
      )}

      <SendLeadEmailDialog open={!!emailLead} onClose={() => setEmailLead(null)} lead={emailLead} ownerId={ownerId} />
      <AddLeadDialog open={addOpen} onClose={() => setAddOpen(false)} ownerId={ownerId} />
    </div>
  );
}