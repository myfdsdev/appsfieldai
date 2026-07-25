import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import LeadCard from "./LeadCard";
import SendLeadEmailDialog from "./SendLeadEmailDialog";

export default function ShortlistTab({ ownerId }) {
  const queryClient = useQueryClient();
  const [emailLead, setEmailLead] = useState(null);

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

  if (shortlisted.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-sm text-muted-foreground">
        <Star className="w-8 h-8 mx-auto mb-2 opacity-30" /> No shortlisted leads yet. Tap the star on any lead to add it here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{shortlisted.length} shortlisted lead{shortlisted.length !== 1 ? "s" : ""} ready to contact.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortlisted.map((l) => (
          <LeadCard key={l.id} lead={l} onToggleShortlist={toggleShortlist} onSendEmail={setEmailLead} />
        ))}
      </div>
      <SendLeadEmailDialog open={!!emailLead} onClose={() => setEmailLead(null)} lead={emailLead} ownerId={ownerId} />
    </div>
  );
}