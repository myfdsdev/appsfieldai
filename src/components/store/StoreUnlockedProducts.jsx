import React, { useState } from "react";
import { KeyRound, ExternalLink, Loader2, Clock } from "lucide-react";
import { requestProductAccess } from "@/lib/storeCustomerAuth";
import { toast } from "sonner";

// Products the customer unlocked through an active subscription plan.
export default function StoreUnlockedProducts({ products = [], brandColor = "#f97316", pal, marketplaceId, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  if (products.length === 0) return null;
  const cardStyle = pal ? { background: pal.card || pal.surface, borderColor: pal.cardBorder, color: pal.text } : undefined;
  const mutedStyle = pal ? { color: `${pal.text}99` } : undefined;

  const request = async (p) => {
    setBusyId(p.id);
    try {
      await requestProductAccess({ marketplaceId, listingId: p.id });
      toast.success("Access requested — the store owner will send your details.");
      onChanged?.();
    } catch (e) {
      toast.error(e.message || "Could not send the request.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" style={mutedStyle}>
        Included With Your Plan
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {products.map((p) => {
          // Owner-granted details win; otherwise fall back to the product's own delivery info.
          const access = p.accessGrant?.accessUrl || p.accessGrant?.instructions
            ? p.accessGrant
            : (p.delivery?.accessUrl || p.delivery?.instructions ? p.delivery : null);
          return (
            <div key={p.id} className={`rounded-2xl border p-4 ${pal ? "" : "bg-card/60 border-border/40"}`} style={cardStyle}>
              <div className="flex items-center gap-3">
                {p.logo ? <img src={p.logo} alt="" className="w-9 h-9 rounded-xl object-cover" /> : <div className="w-9 h-9 rounded-xl bg-secondary" />}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.softwareName}</p>
                  <p className="text-[11px] text-muted-foreground truncate" style={mutedStyle}>{p.planName}</p>
                </div>
              </div>
              {p.shortDescription && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2" style={mutedStyle}>{p.shortDescription}</p>
              )}

              {access ? (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: brandColor }}>
                    <KeyRound className="w-3.5 h-3.5" /> Product Access
                  </p>
                  {access.accessUrl && (
                    <a href={access.accessUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline break-all" style={{ color: brandColor }}>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Open product
                    </a>
                  )}
                  {access.instructions && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5" style={mutedStyle}>{access.instructions}</p>
                  )}
                </div>
              ) : p.accessStatus === "requested" ? (
                <p className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground" style={mutedStyle}>
                  <Clock className="w-3.5 h-3.5" /> Access requested — waiting for the store owner
                </p>
              ) : p.accessStatus === "denied" ? (
                <p className="mt-3 pt-3 border-t border-border/30 text-xs text-red-400">Access request declined.</p>
              ) : (
                <button onClick={() => request(p)} disabled={busyId === p.id}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-60"
                  style={{ background: brandColor }}>
                  {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  Request Access
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}