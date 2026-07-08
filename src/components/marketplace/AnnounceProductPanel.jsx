import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Megaphone, Send, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Lets the store owner announce an affiliate-enabled product to all of their
// active affiliates via email + in-app notification.
export default function AnnounceProductPanel({ marketplaceId }) {
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["affiliateListings", marketplaceId],
    queryFn: async () => {
      const res = await base44.entities.SaaSListing.filter({ marketplaceId, affiliateEnabled: true });
      return Array.isArray(res) ? res : [];
    },
    enabled: !!marketplaceId,
  });

  const announce = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("announceProductToAffiliates", {
        marketplaceId,
        listingId: selectedId,
        customMessage: message.trim() || undefined,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const sent = res.data?.sent || 0;
      toast.success(sent ? `Announced to ${sent} affiliate${sent > 1 ? "s" : ""}` : (res.data?.message || "No affiliates to announce to yet."));
      setMessage("");
    } catch (e) {
      toast.error(e.message || "Failed to announce");
    }
    setBusy(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Enable a product for affiliates first to announce it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 flex items-start gap-2">
        <Megaphone className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">Email all your active affiliates about a product so they can apply and start promoting it.</p>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Product</label>
        <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
          {listings.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selectedId === l.id ? "border-orange-500 bg-orange-500/10" : "border-border/40 bg-card/40 hover:bg-secondary/40"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${l.imageGradient || "from-orange-500 to-amber-500"} shrink-0 overflow-hidden flex items-center justify-center`}>
                {l.logo ? <img src={l.logo} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{l.softwareName}</p>
                <p className="text-[11px] text-emerald-400">{l.affiliateCommissionRate ?? 30}% commission</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Custom message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1.5 px-3 py-2 text-sm h-24 resize-none"
          placeholder="Add a personal note to your affiliates..."
        />
      </div>

      <Button onClick={announce} disabled={busy || !selectedId} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Announce to Affiliates
      </Button>
    </div>
  );
}