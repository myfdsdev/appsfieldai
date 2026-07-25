import React from "react";
import { Globe, Instagram, Facebook, Phone, Mail, Star, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// One found-lead in a horizontal list row: info left, actions right.
export default function LeadRow({ lead, onToggleShortlist, onSendEmail }) {
  const emails = lead.emails || [];
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={() => onToggleShortlist(lead)}
        title={lead.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${lead.shortlisted ? "bg-amber-500/15 text-amber-400" : "bg-secondary/50 text-muted-foreground hover:text-amber-400"}`}
      >
        <Star className={`w-4 h-4 ${lead.shortlisted ? "fill-amber-400" : ""}`} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{lead.businessName}</p>
          {lead.contactStatus === "emailed" && (
            <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Emailed</Badge>
          )}
        </div>
        {lead.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{lead.description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
          {emails.map((e) => (
            <a key={e} href={`mailto:${e}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-400 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {e}
            </a>
          ))}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-400">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {lead.phone}
            </a>
          )}
          {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-orange-400"><Globe className="w-4 h-4" /></a>}
          {lead.instagram && <a href={lead.instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-pink-400"><Instagram className="w-4 h-4" /></a>}
          {lead.facebook && <a href={lead.facebook} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-blue-400"><Facebook className="w-4 h-4" /></a>}
        </div>
      </div>

      <Button
        size="sm"
        onClick={() => onSendEmail(lead)}
        className="shrink-0 gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0"
      >
        <Send className="w-3.5 h-3.5" /> {emails.length === 0 ? "Add Email & Send" : "Send Email"}
      </Button>
    </div>
  );
}