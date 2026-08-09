import React from "react";
import { KeyRound, ExternalLink } from "lucide-react";

// Products the customer unlocked through an active subscription plan.
export default function StoreUnlockedProducts({ products = [], brandColor = "#f97316", pal }) {
  if (products.length === 0) return null;
  const cardStyle = pal ? { background: pal.card || pal.surface, borderColor: pal.cardBorder, color: pal.text } : undefined;
  const mutedStyle = pal ? { color: `${pal.text}99` } : undefined;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" style={mutedStyle}>
        Included With Your Plan
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {products.map((p) => (
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
            {(p.delivery?.accessUrl || p.delivery?.instructions) && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: brandColor }}>
                  <KeyRound className="w-3.5 h-3.5" /> Product Access
                </p>
                {p.delivery.accessUrl && (
                  <a href={p.delivery.accessUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline break-all" style={{ color: brandColor }}>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Open product
                  </a>
                )}
                {p.delivery.instructions && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5" style={mutedStyle}>{p.delivery.instructions}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}