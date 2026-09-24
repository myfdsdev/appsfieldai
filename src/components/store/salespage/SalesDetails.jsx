import React from "react";
import { CheckCircle2, Zap, LifeBuoy, ShieldCheck, KeyRound } from "lucide-react";

// Body sections: features grid, full description, and "what's included" policies.
export default function SalesDetails({ listing, t }) {
  const features = (listing.features || []).filter(Boolean);
  const included = [
    { icon: Zap, label: "Plan limits", value: listing.usageLimits },
    { icon: LifeBuoy, label: "Support", value: listing.supportInfo },
    { icon: ShieldCheck, label: "Refund policy", value: listing.refundPolicy },
    { icon: KeyRound, label: "How to redeem", value: listing.redemptionInstructions },
  ].filter((i) => i.value);

  return (
    <div className="max-w-6xl mx-auto px-5 space-y-14 pb-14">
      {features.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 text-center" style={t.headingStyle}>Everything you get</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-2xl border border-border/40 bg-card" style={t.cardStyle}>
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: t.accent }} />
                <span className="text-sm leading-relaxed">{f}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {listing.fullDescription && (
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-center" style={t.headingStyle}>About {listing.softwareName}</h2>
          <p className="text-base leading-relaxed whitespace-pre-wrap opacity-85">{listing.fullDescription}</p>
        </section>
      )}

      {included.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 text-center" style={t.headingStyle}>What's included</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {included.map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-5 rounded-2xl border border-border/40 bg-card" style={t.cardStyle}>
                <p className="flex items-center gap-2 font-semibold mb-1.5"><Icon className="w-4 h-4" style={{ color: t.accent }} />{label}</p>
                <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {listing.tags?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {listing.tags.map((tag) => <span key={tag} className="text-xs px-3 py-1 rounded-full border border-border/40 opacity-75">#{tag}</span>)}
        </div>
      )}
    </div>
  );
}