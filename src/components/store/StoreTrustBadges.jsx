import React from "react";
import { Shield, Lock, BadgeCheck, CreditCard, Award, ShieldCheck, Globe } from "lucide-react";

// Preset icon keys sellers can pick per badge.
const ICONS = {
  shield: Shield,
  lock: Lock,
  gdpr: ShieldCheck,
  paypal: CreditCard,
  stripe: CreditCard,
  verified: BadgeCheck,
  badge: BadgeCheck,
  award: Award,
  globe: Globe,
};

export default function StoreTrustBadges({ badges = [], title, brandColor = "#f97316" }) {
  const items = (badges || []).filter((b) => b && (b.text || b.imageUrl));
  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      {title && (
        <h3 className="text-center text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-5">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {items.map((b, i) => {
          const Icon = ICONS[b.icon] || BadgeCheck;
          const content = (
            <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/60 backdrop-blur px-4 py-3 hover:border-border transition-colors">
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.text || "Trust badge"} className="h-6 w-auto object-contain" />
              ) : (
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${brandColor}1a`, color: brandColor }}
                >
                  <Icon className="w-4 h-4" />
                </span>
              )}
              {b.text && <span className="text-xs font-medium text-foreground whitespace-nowrap">{b.text}</span>}
            </div>
          );
          return b.link ? (
            <a key={i} href={b.link} target="_blank" rel="noopener noreferrer">{content}</a>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}