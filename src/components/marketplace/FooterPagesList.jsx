import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Eye, EyeOff } from "lucide-react";

export default function FooterPagesList({ marketplaceId }) {
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["customPages", marketplaceId],
    queryFn: () => base44.entities.CustomPage.filter({ marketplaceId }, "sortOrder"),
    enabled: !!marketplaceId,
  });

  const toggleFooter = async (page) => {
    await base44.entities.CustomPage.update(page.id, { showInFooter: !page.showInFooter });
    queryClient.invalidateQueries({ queryKey: ["customPages", marketplaceId] });
  };

  if (isLoading || pages.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[11px] text-muted-foreground">Pages shown as footer links:</p>
      {pages.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs truncate">{p.title}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFooter(p); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 ${p.showInFooter ? "bg-orange-500/20 text-orange-400" : "bg-secondary/60 text-muted-foreground"}`}
          >
            {p.showInFooter ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {p.showInFooter ? "Shown" : "Hidden"}
          </button>
        </div>
      ))}
    </div>
  );
}