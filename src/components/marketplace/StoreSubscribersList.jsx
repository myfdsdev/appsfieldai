import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Loader2 } from "lucide-react";

const STATUS = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  past_due: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  cancelled: "bg-muted text-muted-foreground border-border/40",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function StoreSubscribersList({ marketplaceId }) {
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["storeSubscribers", marketplaceId],
    queryFn: () => base44.entities.StoreSubscription.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (subs.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-dashed border-border/40 text-muted-foreground">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No subscribers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subs.map(s => (
        <div key={s.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/60">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{s.customerName || s.customerEmail || "Customer"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {s.planName} · {s.currency} {s.price} · {s.billingType === "one_time" ? "One-time" : s.billingType}
              {s.currentPeriodEnd ? ` · renews ${new Date(s.currentPeriodEnd).toLocaleDateString()}` : ""}
            </p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS[s.status] || STATUS.pending}`}>{s.status}</span>
        </div>
      ))}
    </div>
  );
}