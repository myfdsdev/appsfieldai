import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE = {
  requested: "bg-amber-500/15 text-amber-400",
  granted: "bg-emerald-500/15 text-emerald-400",
  denied: "bg-red-500/15 text-red-400",
};

// Owner-side queue of product access requests coming from plan subscribers.
export default function StoreAccessRequests({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [accessUrl, setAccessUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["storeAccessRequests", marketplaceId],
    queryFn: () => base44.entities.StoreProductAccess.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["storeAccessRequests", marketplaceId] });

  const openGrant = (row) => {
    setEditing(row);
    setAccessUrl(row.accessUrl || "");
    setInstructions(row.instructions || "");
  };

  const grant = async () => {
    setSaving(true);
    await base44.entities.StoreProductAccess.update(editing.id, {
      status: "granted",
      accessUrl,
      instructions,
      grantedAt: new Date().toISOString(),
    });
    setSaving(false);
    setEditing(null);
    refresh();
    toast.success("Access granted.");
  };

  const deny = async (row) => {
    await base44.entities.StoreProductAccess.update(row.id, { status: "denied" });
    refresh();
    toast.success("Request denied.");
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl border border-dashed border-border/40 text-muted-foreground">
        <KeyRound className="w-7 h-7 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No product access requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="p-4 rounded-xl border border-border/40 bg-card/60">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.listingTitle || "Product"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.customerName || r.customerEmail} · {r.planName || "Plan"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
              <Button size="sm" onClick={() => openGrant(r)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg gap-1">
                <Check className="w-3.5 h-3.5" /> {r.status === "granted" ? "Edit access" : "Grant access"}
              </Button>
              {r.status === "requested" && (
                <Button size="sm" variant="outline" onClick={() => deny(r)} className="border-red-500/30 text-red-400 rounded-lg"><X className="w-3.5 h-3.5" /></Button>
              )}
            </div>
          </div>

          {editing?.id === r.id && (
            <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
              <Input value={accessUrl} onChange={(e) => setAccessUrl(e.target.value)} placeholder="Access URL (https://...)" className="bg-secondary/50 border-border/30 rounded-xl" />
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Login details / instructions for the customer" className="bg-secondary/50 border-border/30 rounded-xl h-20 resize-none" />
              <div className="flex gap-2">
                <Button size="sm" onClick={grant} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send Access
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="border-border/40 rounded-lg">Cancel</Button>
              </div>
            </div>
          )}

          {r.status === "granted" && editing?.id !== r.id && (r.accessUrl || r.instructions) && (
            <p className="mt-2 text-xs text-muted-foreground break-all">{r.accessUrl} {r.instructions ? `· ${r.instructions}` : ""}</p>
          )}
        </div>
      ))}
    </div>
  );
}